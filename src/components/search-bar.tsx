"use client";

import { useState, useEffect, useCallback } from "react";

interface Props {
  onSearch: (query: string) => void;
  onFilterChange: (filters: { source?: string; author?: string }) => void;
  resultCount?: number;
  query?: string;
}

export function SearchBar({ onSearch, onFilterChange, resultCount, query }: Props) {
  const [input, setInput] = useState(query ?? "");
  const [author, setAuthor] = useState("");

  const debounceSearch = useCallback(
    (() => {
      let timer: ReturnType<typeof setTimeout>;
      return (value: string) => {
        clearTimeout(timer);
        timer = setTimeout(() => onSearch(value), 300);
      };
    })(),
    [onSearch],
  );

  useEffect(() => {
    setInput(query ?? "");
  }, [query]);

  return (
    <div className="space-y-3 mb-6">
      <div className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            debounceSearch(e.target.value);
          }}
          placeholder="Search bookmarks..."
          className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white transition"
        />
        <input
          type="text"
          value={author}
          onChange={(e) => {
            setAuthor(e.target.value);
            onFilterChange({ author: e.target.value || undefined });
          }}
          placeholder="@author"
          className="w-36 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white transition text-sm"
        />
      </div>
      {(query || author) && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            {resultCount !== undefined && `${resultCount} results`}
            {query && ` for "${query}"`}
            {author && ` by ${author}`}
          </p>
          <button
            onClick={() => {
              setInput("");
              setAuthor("");
              onSearch("");
              onFilterChange({});
            }}
            className="text-xs text-gray-500 hover:text-white transition"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
