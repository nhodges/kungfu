import Link from "next/link";

interface BookmarkCardProps {
  id: string;
  content: string;
  authorName: string;
  authorHandle: string;
  url: string;
  createdAt: string;
  source: string;
}

export function BookmarkCard({
  id,
  content,
  authorName,
  authorHandle,
  url,
  createdAt,
  source,
}: BookmarkCardProps) {
  return (
    <div className="border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-white">{authorName}</span>
            <span className="text-sm text-gray-500">{authorHandle}</span>
            <span className="text-xs px-1.5 py-0.5 bg-gray-800 text-gray-400 rounded">
              {source}
            </span>
          </div>
          <Link href={`/dashboard/bookmarks/${id}`}>
            <p className="text-gray-300 line-clamp-3 hover:text-white transition">{content}</p>
          </Link>
          <p className="text-xs text-gray-500 mt-2">
            {new Date(createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-500 hover:text-white transition shrink-0"
        >
          Original
        </a>
      </div>
    </div>
  );
}
