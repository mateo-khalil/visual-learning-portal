"use client";

import { useEffect, useState } from "react";
import { THEME_KEY } from "@/lib/storage";
import { UI } from "@/lib/ui";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {}
    setDark(next);
  };
  return (
    <button onClick={toggle} aria-label={UI.theme} className="btn inline-flex h-9 w-9 items-center justify-center text-[15px]">
      {dark ? "☀" : "☾"}
    </button>
  );
}
