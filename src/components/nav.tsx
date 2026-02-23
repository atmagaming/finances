"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const links = [
  { href: "/", label: "Overview" },
  { href: "/transactions", label: "Transactions" },
  { href: "/revenue", label: "Revenue" },
  { href: "/projections", label: "Projections" },
];

interface NavProps {
  userName?: string;
  userImage?: string | null;
}

export function Nav({ userName, userImage }: NavProps) {
  const pathname = usePathname();
  const isAuthenticated = !!userName;

  return (
    <nav className="border-b border-[var(--border)] bg-[var(--bg-card)]">
      <div className="mx-auto flex max-w-7xl items-center gap-8 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-semibold tracking-tight text-[var(--accent)]">
          Atma Finances
        </Link>
        <div className="flex flex-1 gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                pathname === link.href
                  ? "bg-[var(--accent)] text-white"
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
              {userImage && <Image src={userImage} alt={userName} width={28} height={28} className="rounded-full" />}
              <span className="text-sm text-[var(--text-muted)]">{userName}</span>
              <button
                type="button"
                onClick={() => void signOut({ callbackUrl: "/login" })}
                className="rounded-md px-3 py-1.5 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text)] hover:bg-[var(--bg-card-hover)]"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-md px-3 py-1.5 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text)] hover:bg-[var(--bg-card-hover)]"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
