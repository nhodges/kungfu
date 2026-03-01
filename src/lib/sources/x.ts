import { Twitter } from "arctic";
import { decrypt, encrypt } from "@/lib/crypto";
import { ExternalApiError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type {
  SourceProvider,
  SourceConnection,
  OAuthResult,
  BookmarkPage,
  IngestedBookmark,
} from "./types";

const X_API_BASE = "https://api.x.com/2";
const BOOKMARKS_PER_PAGE = 50;

function getTwitterClient(redirectUri: string): Twitter {
  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("X_CLIENT_ID and X_CLIENT_SECRET must be set");
  }
  return new Twitter(clientId, clientSecret, redirectUri);
}

export class XProvider implements SourceProvider {
  readonly source = "x";

  async getAuthUrl(redirectUri: string) {
    const twitter = getTwitterClient(redirectUri);
    const state = crypto.randomUUID();
    const codeVerifier = crypto.randomUUID() + crypto.randomUUID();
    const scopes = ["bookmark.read", "tweet.read", "users.read", "offline.access"];
    const url = twitter.createAuthorizationURL(state, codeVerifier, scopes);
    return { url: url.toString(), codeVerifier, state };
  }

  async handleCallback(
    code: string,
    codeVerifier: string,
    redirectUri: string,
  ): Promise<OAuthResult> {
    const twitter = getTwitterClient(redirectUri);
    const tokens = await twitter.validateAuthorizationCode(code, codeVerifier);
    const accessToken = tokens.accessToken();
    const refreshToken = tokens.hasRefreshToken() ? tokens.refreshToken() : null;
    const expiresAt = tokens.accessTokenExpiresAt();

    const userInfo = await this.fetchUserInfo(accessToken);

    return {
      accessToken,
      refreshToken,
      expiresAt,
      sourceUserId: userInfo.id,
      sourceUsername: userInfo.username,
    };
  }

  async refreshToken(connection: SourceConnection) {
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const twitter = getTwitterClient(`${baseUrl}/api/connections/x/callback`);
    const currentRefreshToken = decrypt(connection.refreshToken!);
    const tokens = await twitter.refreshAccessToken(currentRefreshToken);
    return {
      accessToken: tokens.accessToken(),
      refreshToken: tokens.hasRefreshToken() ? tokens.refreshToken() : null,
      expiresAt: tokens.accessTokenExpiresAt(),
    };
  }

  async fetchBookmarks(
    connection: SourceConnection,
    cursor?: string,
  ): Promise<BookmarkPage> {
    const accessToken = decrypt(connection.accessToken);
    const url = new URL(`${X_API_BASE}/users/${connection.sourceUserId}/bookmarks`);
    url.searchParams.set("max_results", String(BOOKMARKS_PER_PAGE));
    url.searchParams.set("tweet.fields", "created_at,author_id,text,attachments");
    url.searchParams.set("expansions", "author_id,attachments.media_keys");
    url.searchParams.set("media.fields", "url,preview_image_url,type");
    url.searchParams.set("user.fields", "username,name");
    if (cursor) {
      url.searchParams.set("pagination_token", cursor);
    }

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // Handle rate limiting
    if (response.status === 429) {
      const resetHeader = response.headers.get("x-rate-limit-reset");
      const resetAt = resetHeader
        ? new Date(parseInt(resetHeader, 10) * 1000)
        : new Date(Date.now() + 15 * 60 * 1000);
      logger.warn({ resetAt }, "X API rate limited");
      return { bookmarks: [], nextCursor: cursor ?? null, rateLimited: { resetAt } };
    }

    // Handle token expiry — caller should refresh and retry
    if (response.status === 401) {
      throw new ExternalApiError("X API token expired", { status: 401, needsRefresh: true });
    }

    // Handle permission issues
    if (response.status === 403) {
      throw new ExternalApiError("X API access denied — reconnect may be required", {
        status: 403,
        needsReauth: true,
      });
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "unknown");
      throw new ExternalApiError(`X API error: ${response.status}`, { status: response.status, body });
    }

    const data = await response.json();
    return this.parseBookmarksResponse(data, connection.sourceUserId);
  }

  private async fetchUserInfo(accessToken: string): Promise<{ id: string; username: string }> {
    const response = await fetch(`${X_API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      throw new ExternalApiError("Failed to fetch X user info");
    }
    const data = await response.json();
    return { id: data.data.id, username: data.data.username };
  }

  private parseBookmarksResponse(
    data: XBookmarksApiResponse,
    _sourceUserId: string,
  ): BookmarkPage {
    if (!data.data || data.data.length === 0) {
      return { bookmarks: [], nextCursor: null };
    }

    const usersMap = new Map<string, { name: string; username: string }>();
    if (data.includes?.users) {
      for (const user of data.includes.users) {
        usersMap.set(user.id, { name: user.name, username: user.username });
      }
    }

    const mediaMap = new Map<string, string>();
    if (data.includes?.media) {
      for (const media of data.includes.media) {
        if (media.url || media.preview_image_url) {
          mediaMap.set(media.media_key, media.url ?? media.preview_image_url ?? "");
        }
      }
    }

    const bookmarks: IngestedBookmark[] = data.data.map((tweet) => {
      const author = usersMap.get(tweet.author_id) ?? { name: "Unknown", username: "unknown" };
      const mediaKeys = tweet.attachments?.media_keys ?? [];
      const mediaUrls = mediaKeys.map((k) => mediaMap.get(k)).filter(Boolean) as string[];

      return {
        sourceId: tweet.id,
        url: `https://x.com/${author.username}/status/${tweet.id}`,
        content: tweet.text,
        authorName: author.name,
        authorHandle: `@${author.username}`,
        mediaUrls,
        metadata: { author_id: tweet.author_id },
        createdAt: new Date(tweet.created_at),
      };
    });

    const nextCursor = data.meta?.next_token ?? null;
    return { bookmarks, nextCursor };
  }
}

// X API v2 response types
interface XBookmarksApiResponse {
  data?: XTweet[];
  includes?: {
    users?: XUser[];
    media?: XMedia[];
  };
  meta?: {
    next_token?: string;
    result_count: number;
  };
}

interface XTweet {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  attachments?: {
    media_keys?: string[];
  };
}

interface XUser {
  id: string;
  name: string;
  username: string;
}

interface XMedia {
  media_key: string;
  type: string;
  url?: string;
  preview_image_url?: string;
}

export const xProvider = new XProvider();
