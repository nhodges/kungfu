"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await signIn("resend", { email, callbackUrl: "/dashboard" });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="max-w-md w-full p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Check your email</h1>
          <p className="text-gray-400">
            We sent a magic link to <span className="text-white font-medium">{email}</span>.
            Click the link to sign in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="max-w-md w-full p-8">
        <h1 className="text-3xl font-bold text-white mb-2">KUNGFU.SH</h1>
        <p className="text-gray-400 mb-8">Sign in with your email to get started.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white transition"
          />
          <button
            type="submit"
            className="w-full px-4 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition"
          >
            Send magic link
          </button>
        </form>
      </div>
    </div>
  );
}
