"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/members", label: "Members" },
  { href: "/foods", label: "Foods" },
  { href: "/exercises", label: "Exercises" },
];

export function NavLinks() {
  const path = usePathname();
  return (
    <nav className="flex gap-1">
      {LINKS.map((l) => {
        const active = path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`flex min-h-12 items-center rounded-xl px-4 font-medium ${active ? "bg-brand text-ink" : "text-white hover:bg-raised"}`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
