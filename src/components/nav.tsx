"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const links = [
  { href: "/", label: "Overview" },
  { href: "/transactions", label: "Transactions" },
];

interface NavProps {
  userName?: string;
  userImage?: string | null;
}

export function Nav({ userName, userImage }: NavProps) {
  const pathname = usePathname();
  const isAuthenticated = !!userName;

  return (
    <nav className="bg-[var(--bg-card)]" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
      <div className="mx-auto flex max-w-7xl items-center gap-8 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-bold tracking-tight text-[var(--accent)]">
          Atma Finances
        </Link>
        <div className="flex flex-1 gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "bg-[var(--accent-light)] text-[var(--accent)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-card-hover)]"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {userImage && (
                <Image
                  src={userImage}
                  alt={userName}
                  width={32}
                  height={32}
                  className="rounded-full ring-2 ring-[var(--border)]"
                />
              )}
              <span className="text-sm font-medium text-[var(--text)]">{userName}</span>
              <button
                type="button"
                onClick={() => void signOut({ callbackUrl: "/login" })}
                className="rounded-lg px-3 py-1.5 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text)] hover:bg-[var(--bg-card-hover)]"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-[var(--accent)] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
