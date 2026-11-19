"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { visibleNav as nav, site } from "@/lib/site";
import ThemeToggle from "./ThemeToggle";
import { useProgress } from "@/lib/progress";

/** The portal name: first word in the accent color, then the rest, then the optional badge. */
function Brand() {
  const [first, ...rest] = site.name.split(" ");
  return (
    <>
      <span className="text-accent">{first}</span>
      {rest.length ? ` ${rest.join(" ")}` : ""}
      {site.badge && (
        <span className="ml-1.5 rounded bg-accent px-1.5 py-0.5 align-middle text-[0.65rem] font-bold text-on-accent">{site.badge}</span>
      )}
    </>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { map: done } = useProgress();

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/" className="font-bold tracking-tight">
          <Brand />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </header>

      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 transform overflow-y-auto border-r border-border bg-card px-4 py-5 no-scrollbar transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-5 hidden items-center justify-between lg:flex">
          <Link href="/" className="text-lg font-bold tracking-tight">
            <Brand />
          </Link>
          <ThemeToggle />
        </div>
        <p className="mb-4 px-1 text-xs leading-relaxed text-muted">
          {site.tagline}
        </p>

        <nav className="space-y-5 pb-10">
          {nav.map((section) => (
            <div key={section.title}>
              <p className="mb-1.5 px-2 text-[0.7rem] font-semibold uppercase tracking-wider text-muted">
                {section.title}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== "/" &&
                      !item.href.includes("#") &&
                      pathname.startsWith(item.href));
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        {...(item.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                        className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm transition ${
                          active
                            ? "bg-accent/12 font-medium text-accent"
                            : "text-foreground/80 hover:bg-foreground/5"
                        }`}
                      >
                        <span>{item.title}</span>
                        <span className="ml-2 flex items-center gap-1 text-xs">
                          {done[item.href] && (
                            <span className="text-accent" title="Studied">
                              ✓
                            </span>
                          )}
                          {item.badge && <span className="text-muted">{item.badge}</span>}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
