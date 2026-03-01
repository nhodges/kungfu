"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export function Nav({ email }: { email: string }) {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <nav className="border-b border-gray-800">
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-bold text-lg">
            KUNGFU.SH
          </Link>
          <div className="flex gap-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition ${
                  pathname === link.href
                    ? "text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{email}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-sm text-gray-400 hover:text-white transition"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
