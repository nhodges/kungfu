export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Bookmarks</h1>
      <div className="border border-gray-800 rounded-lg p-12 text-center">
        <p className="text-gray-400 text-lg mb-2">No bookmarks yet</p>
        <p className="text-gray-500 text-sm">
          Connect your X account in{" "}
          <a href="/settings" className="text-white underline">
            Settings
          </a>{" "}
          and sync your bookmarks to get started.
        </p>
      </div>
    </div>
  );
}
