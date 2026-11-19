export default function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-7">
      {eyebrow && (
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-accent">
          {eyebrow}
        </p>
      )}
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      {children && (
        <div className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          {children}
        </div>
      )}
    </header>
  );
}
