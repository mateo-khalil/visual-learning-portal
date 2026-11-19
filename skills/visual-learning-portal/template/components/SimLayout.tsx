import Link from "next/link";
import PageHeader from "./PageHeader";

/** Wrapper for simulator pages: header + optional "read the theory" link + content. */
export default function SimLayout({
  eyebrow,
  title,
  intro,
  theoryHref,
  theoryLabel = "Read the theory",
  children,
}: {
  eyebrow?: string;
  title: string;
  intro?: React.ReactNode;
  theoryHref?: string;
  theoryLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <PageHeader eyebrow={eyebrow} title={title}>
        {intro}
      </PageHeader>
      {theoryHref && (
        <Link
          href={theoryHref}
          className="mb-5 inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium transition hover:border-accent"
        >
          📖 {theoryLabel} →
        </Link>
      )}
      <div className="space-y-5">{children}</div>
    </div>
  );
}
