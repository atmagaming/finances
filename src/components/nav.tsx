"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Overview" },
  { href: "/transactions", label: "Transactions" },
  { href: "/projections", label: "Projections" },
  { href: "/revenue", label: "Revenue" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-[var(--border)] bg-[var(--bg-card)]">
      <div className="mx-auto flex max-w-7xl items-center gap-8 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-semibold tracking-tight text-[var(--accent)]">
          Atma Finances
        </Link>
        <div className="flex gap-1">
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
      </div>
    </nav>
  );
}
