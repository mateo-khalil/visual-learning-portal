import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { site } from "@/lib/site";
import { THEME_KEY } from "@/lib/storage";

export const metadata: Metadata = {
  title: `${site.name} — ${site.tagline}`,
  description: site.description,
};

// Runs before paint: the saved theme, or the system preference (no flash of the wrong theme).
const themeInit = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark");}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={site.locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-screen">
        <Sidebar />
        <main className="px-5 py-8 lg:ml-72 lg:px-12 lg:py-12">
          <div className="mx-auto max-w-4xl">{children}</div>
        </main>
      </body>
    </html>
  );
}
