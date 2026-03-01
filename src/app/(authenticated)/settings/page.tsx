import { auth } from "@/lib/auth";

export default async function SettingsPage() {
  const session = await auth();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Account</h2>
        <div className="border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">
            Email: <span className="text-white">{session?.user?.email}</span>
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Connected Sources</h2>
        <div className="border border-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">X (Twitter)</p>
              <p className="text-sm text-gray-400">Import your X bookmarks</p>
            </div>
            <button
              disabled
              className="px-4 py-2 bg-gray-800 text-gray-400 rounded-lg cursor-not-allowed text-sm"
            >
              Connect X
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
