import Link from "next/link";

export function AppShell({
  children,
  title,
  subtitle,
  nav,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  nav?: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border/70 bg-card/60 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-end justify-between gap-4 px-4 py-4">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Headstash
            </p>
            <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{title}</h1>
            {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
          {nav ? <nav aria-label="Primary" className="flex flex-wrap gap-2">{nav}</nav> : null}
        </div>
      </header>

      <main id="main-content" className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
        {children}
      </main>

      <footer className="border-t border-border/70 py-4 text-center text-xs text-muted-foreground">
        Built for quick notes, honest takes, and social discovery.
      </footer>
    </div>
  );
}

export function AppShellNavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground transition hover:bg-hover hover:text-foreground"
    >
      {children}
    </Link>
  );
}

export function Container({
  children,
  id = "main-content",
}: {
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <main
      id={id}
      className="mx-auto flex min-h-dvh max-w-[68ch] flex-col gap-5 px-4 py-6"
    >
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
        {subtitle ? (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {right}
    </header>
  );
}

type ButtonTone = "default" | "primary";

export function buttonClassName(tone: ButtonTone = "default") {
  if (tone === "primary") {
    return "rounded-lg border border-border bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border";
  }

  return "rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border";
}

export function ButtonLink({
  href,
  children,
  tone = "default",
}: {
  href: string;
  children: React.ReactNode;
  tone?: ButtonTone;
}) {
  return (
    <Link href={href} className={buttonClassName(tone)}>
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
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export const inputClassName =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-border";
