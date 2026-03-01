export interface SourceConnection {
  id: string;
  source: string;
  sourceUserId: string;
  sourceUsername: string;
  accessToken: string; // encrypted
  refreshToken: string | null; // encrypted
  tokenExpiresAt: Date | null;
  userId: string;
}

export interface BookmarkPage {
  bookmarks: IngestedBookmark[];
  nextCursor: string | null;
  rateLimited?: {
    resetAt: Date;
  };
}

export interface IngestedBookmark {
  sourceId: string;
  url: string;
  content: string;
  authorName: string;
  authorHandle: string;
  mediaUrls: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface OAuthResult {
  accessToken: string; // plaintext, will be encrypted before storage
  refreshToken: string | null;
  expiresAt: Date | null;
  sourceUserId: string;
  sourceUsername: string;
}

export interface SourceProvider {
  readonly source: string;

  getAuthUrl(redirectUri: string): Promise<{
    url: string;
    codeVerifier: string;
    state: string;
  }>;

  handleCallback(
    code: string,
    codeVerifier: string,
    redirectUri: string,
  ): Promise<OAuthResult>;

  refreshToken(connection: SourceConnection): Promise<{
    accessToken: string;
    refreshToken: string | null;
    expiresAt: Date | null;
  }>;

  fetchBookmarks(
    connection: SourceConnection,
    cursor?: string,
  ): Promise<BookmarkPage>;
}
