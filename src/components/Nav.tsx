import Image from "next/image";
import Link from "next/link";
import { logout } from "@/app/login/actions";
import { NavLinks } from "./NavLinks";

export function Nav({ name }: { name: string }) {
  return (
    <header className="no-print z-10 border-b border-line bg-ink/95 backdrop-blur sm:sticky sm:top-0">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-2">
        <Link href="/members" className="mr-2 flex items-center gap-2">
          <Image src="/logo.png" alt="Fitness+ Gym" width={44} height={44} className="rounded-full" />
          <div className="leading-tight">
            <p className="text-base font-extrabold tracking-tight">
              Fitness<span className="text-brand">+</span> Gym
            </p>
            <p className="text-xs text-muted">Staff Portal</p>
          </div>
        </Link>
        <NavLinks />
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-sm text-muted sm:inline">{name}</span>
          <form action={logout}>
            <button className="min-h-12 rounded-xl px-3 text-muted hover:text-white">Log out</button>
          </form>
        </div>
      </div>
    </header>
  );
}
