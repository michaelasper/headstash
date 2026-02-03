import Link from "next/link";

export function Container({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[68ch] flex-col gap-5 px-4 py-6">
      {children}
    </main>
  );
}

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold leading-[var(--lh-heading)] tracking-tight">
          {title}
        </h1>
        {subtitle ? <p className="text-sm text-neutral-600">{subtitle}</p> : null}
      </div>
      {right}
    </header>
  );
}

export function ButtonLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-hover"
    >
      {children}
    </Link>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-border bg-card p-4 ${className}`}>
      {children}
    </section>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {hint ? <span className="text-xs text-neutral-500">{hint}</span> : null}
    </label>
  );
}

export const inputClassName =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-border";
