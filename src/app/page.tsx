import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <div className="max-w-2xl text-center px-4">
        <h1 className="text-5xl font-bold mb-4">KUNGFU.SH</h1>
        <p className="text-xl text-gray-400 mb-8">
          I know kung fu. Your bookmarks from everywhere, searchable by anything.
        </p>
        <Link
          href="/auth/signin"
          className="inline-block px-8 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition"
        >
          Get started
        </Link>
      </div>
    </div>
  );
}
