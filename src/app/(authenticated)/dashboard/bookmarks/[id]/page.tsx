import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function BookmarkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const userId = session!.user!.id!;
  const { id } = await params;

  const bookmark = await prisma.bookmark.findUnique({
    where: { id },
  });

  if (!bookmark || bookmark.userId !== userId) {
    notFound();
  }

  return (
    <div>
      <Link
        href="/dashboard"
        className="text-sm text-gray-400 hover:text-white transition mb-4 inline-block"
      >
        &larr; Back to bookmarks
      </Link>

      <div className="border border-gray-800 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="font-medium text-white">{bookmark.authorName}</span>
          <span className="text-gray-500">{bookmark.authorHandle}</span>
          <span className="text-xs px-1.5 py-0.5 bg-gray-800 text-gray-400 rounded">
            {bookmark.source}
          </span>
        </div>

        <p className="text-gray-200 whitespace-pre-wrap text-lg leading-relaxed mb-6">
          {bookmark.content}
        </p>

        {bookmark.mediaUrls.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-6">
            {bookmark.mediaUrls.map((url, i) => (
              <img
                key={i}
                src={url}
                alt=""
                className="rounded-lg w-full object-cover"
                loading="lazy"
              />
            ))}
          </div>
        )}

        <div className="border-t border-gray-800 pt-4 space-y-2 text-sm text-gray-400">
          <p>
            Created:{" "}
            {bookmark.createdAt.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p>
            Ingested:{" "}
            {bookmark.ingestedAt.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:underline inline-block"
          >
            View original on {bookmark.source === "x" ? "X" : bookmark.source}
          </a>
        </div>
      </div>
    </div>
  );
}
