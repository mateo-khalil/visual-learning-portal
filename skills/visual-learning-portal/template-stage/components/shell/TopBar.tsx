import Link from "next/link";
import { site } from "@/lib/site";
import { UI } from "@/lib/ui";
import ThemeToggle from "./ThemeToggle";

export function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <g stroke="var(--outline)" strokeWidth={1.6} strokeLinejoin="round">
        <polygon points="16,3 28,10 16,17 4,10" fill="var(--amber-1)" />
        <polygon points="4,10 16,17 16,29 4,22" fill="var(--amber-2)" />
        <polygon points="28,10 16,17 16,29 28,22" fill="var(--amber-3)" />
      </g>
      <path d="M9 10.2 L16 14 L23 10.2" fill="none" stroke="var(--outline)" strokeWidth={1.4} strokeDasharray="2 2" />
    </svg>
  );
}

export default function TopBar({ children }: { children?: React.ReactNode }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-bg/90 px-3 backdrop-blur md:px-4">
      {children}
      <Link href="/" className="flex items-center gap-2 font-mono text-[15px] font-bold tracking-tight">
        <Logo />
        <span>
          {site.name}
          {site.badge && <span className="ml-1.5 rounded-md bg-[var(--amber-1)] px-1.5 py-0.5 text-[11px] text-[var(--fg)] dark:bg-[#4a3b17]">{site.badge}</span>}
        </span>
      </Link>
      <nav className="ml-auto flex items-center gap-2">
        <Link href="/" className="btn hidden px-3 py-1.5 font-mono text-[12.5px] font-semibold sm:inline-block">
          {UI.lessonsLink}
        </Link>
        {site.links.map((l) => (
          <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="btn hidden px-3 py-1.5 font-mono text-[12.5px] font-semibold md:inline-block">
            {l.label}
          </a>
        ))}
        <ThemeToggle />
      </nav>
    </header>
  );
}
