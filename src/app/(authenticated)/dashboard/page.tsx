import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const bookmarkCount = await prisma.bookmark.count({ where: { userId } });
  const connection = await prisma.sourceConnection.findUnique({
    where: { userId_source: { userId, source: "x" } },
  });

  if (bookmarkCount === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Bookmarks</h1>
        <div className="border border-gray-800 rounded-lg p-12 text-center">
          <p className="text-gray-400 text-lg mb-2">No bookmarks yet</p>
          <p className="text-gray-500 text-sm">
            {connection ? (
              <>
                Your X account is connected. Head to{" "}
                <Link href="/settings" className="text-white underline">
                  Settings
                </Link>{" "}
                and click &quot;Sync Now&quot; to import your bookmarks.
              </>
            ) : (
              <>
                Connect your X account in{" "}
                <Link href="/settings" className="text-white underline">
                  Settings
                </Link>{" "}
                to get started.
              </>
            )}
          </p>
        </div>
      </div>
    );
  }

  const recentBookmarks = await prisma.bookmark.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Bookmarks</h1>
        <span className="text-sm text-gray-400">{bookmarkCount} total</span>
      </div>
      <div className="space-y-3">
        {recentBookmarks.map((bookmark) => (
          <div key={bookmark.id} className="border border-gray-800 rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-400 mb-1">
                  {bookmark.authorName}{" "}
                  <span className="text-gray-500">{bookmark.authorHandle}</span>
                </p>
                <p className="text-white line-clamp-3">{bookmark.content}</p>
              </div>
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-white transition shrink-0"
              >
                View original
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
