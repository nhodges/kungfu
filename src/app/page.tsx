import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="max-w-4xl mx-auto px-4 flex items-center justify-between h-14">
        <span className="font-bold text-lg">KUNGFU.SH</span>
        <Link
          href="/auth/signin"
          className="text-sm text-gray-400 hover:text-white transition"
        >
          Sign in
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto px-4 pt-32 pb-20">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-4 tracking-tight">I know kung fu.</h1>
          <p className="text-xl text-gray-400 max-w-xl mx-auto mb-8">
            Your bookmarks from everywhere, searchable by anything. Connect your accounts,
            sync your saves, search with an API.
          </p>
          <Link
            href="/auth/signin"
            className="inline-block px-8 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition text-lg"
          >
            Get started free
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="border border-gray-800 rounded-lg p-6">
            <h3 className="font-semibold mb-2">Connect sources</h3>
            <p className="text-sm text-gray-400">
              Link your X account with one click. Instagram and Reddit coming soon.
            </p>
          </div>
          <div className="border border-gray-800 rounded-lg p-6">
            <h3 className="font-semibold mb-2">Sync bookmarks</h3>
            <p className="text-sm text-gray-400">
              We fetch and store your bookmarks automatically. Handles rate limits, resumes where it left off.
            </p>
          </div>
          <div className="border border-gray-800 rounded-lg p-6">
            <h3 className="font-semibold mb-2">Search + API</h3>
            <p className="text-sm text-gray-400">
              Full-text search across all your bookmarks. REST API with API keys for agents and scripts.
            </p>
          </div>
        </div>

        <div className="border border-gray-800 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-3">Built for agents</h2>
          <p className="text-gray-400 max-w-lg mx-auto mb-4">
            Generate an API key, point your LLM agent at our REST API, and give it instant
            access to everything you&apos;ve ever bookmarked.
          </p>
          <code className="text-sm text-gray-500 bg-gray-900 px-4 py-2 rounded-lg inline-block">
            curl -H &quot;Authorization: Bearer kf_...&quot; kungfu.sh/api/v1/bookmarks?q=react
          </code>
        </div>
      </main>

      <footer className="max-w-4xl mx-auto px-4 py-8 border-t border-gray-800">
        <p className="text-sm text-gray-600 text-center">KUNGFU.SH</p>
      </footer>
    </div>
  );
}
