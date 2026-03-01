"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { BookmarkCard } from "./bookmark-card";

interface Bookmark {
  id: string;
  content: string;
  authorName: string;
  authorHandle: string;
  url: string;
  createdAt: string;
  source: string;
}

interface Props {
  initialQuery?: string;
}

export function BookmarkList({ initialQuery }: Props) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [query, setQuery] = useState(initialQuery ?? "");
  const [authorFilter, setAuthorFilter] = useState("");
  const [searchInput, setSearchInput] = useState(initialQuery ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchBookmarks = useCallback(
    async (reset = false) => {
      setLoading(true);
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (authorFilter) params.set("author", authorFilter);
      if (!reset && cursor) params.set("cursor", cursor);
      params.set("limit", "20");

      try {
        const res = await fetch(`/api/bookmarks?${params}`);
        if (!res.ok) return;
        const data = await res.json();

        if (reset) {
          setBookmarks(data.bookmarks);
        } else {
          setBookmarks((prev) => [...prev, ...data.bookmarks]);
        }
        setCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
      } finally {
        setLoading(false);
      }
    },
    [query, authorFilter, cursor],
  );

  useEffect(() => {
    setBookmarks([]);
    setCursor(null);
    setHasMore(true);
    fetchBookmarks(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, authorFilter]);

  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setQuery(value), 300);
  }

  return (
    <div>
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search bookmarks..."
          className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white transition text-sm"
        />
        <input
          type="text"
          value={authorFilter}
          onChange={(e) => setAuthorFilter(e.target.value)}
          placeholder="@author"
          className="w-40 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white transition text-sm"
        />
        {(query || authorFilter) && (
          <button
            onClick={() => {
              setSearchInput("");
              setQuery("");
              setAuthorFilter("");
            }}
            className="px-3 py-2 text-sm text-gray-400 hover:text-white transition"
          >
            Clear
          </button>
        )}
      </div>

      {query && (
        <p className="text-sm text-gray-400 mb-4">
          Showing results for &quot;{query}&quot;
        </p>
      )}

      <div className="space-y-3">
        {bookmarks.map((b) => (
          <BookmarkCard
            key={b.id}
            id={b.id}
            content={b.content}
            authorName={b.authorName}
            authorHandle={b.authorHandle}
            url={b.url}
            createdAt={b.createdAt}
            source={b.source}
          />
        ))}
      </div>

      {bookmarks.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-400">
            {query ? "No bookmarks match your search." : "No bookmarks yet."}
          </p>
        </div>
      )}

      {hasMore && !loading && bookmarks.length > 0 && (
        <button
          onClick={() => fetchBookmarks()}
          className="w-full mt-4 py-3 text-sm text-gray-400 hover:text-white border border-gray-800 rounded-lg hover:border-gray-700 transition"
        >
          Load more
        </button>
      )}

      {loading && (
        <p className="text-center py-4 text-gray-500 text-sm">Loading...</p>
      )}
    </div>
  );
}
