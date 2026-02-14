import Link from "next/link";

export default function Home() {
  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-dvh max-w-xl flex-col gap-6 px-4 py-8"
    >
      <header className="flex flex-col gap-2">
        <h1 className="text-h1">Headstash</h1>
        <p className="text-sm text-muted-foreground">
          Track strains, share takes, and find trusted cannabis reviews.
        </p>
      </header>

      <section className="rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-1)]">
        <h2 className="text-base font-medium">Find reviews</h2>
        <form
          action="/reviews"
          method="get"
          className="mt-3 flex gap-2"
          aria-label="Search reviews"
        >
          <label htmlFor="home-review-query" className="sr-only">
            Search by strain name or notes
          </label>
          <input
            id="home-review-query"
            name="q"
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none"
            placeholder="Search strain name or notes…"
          />
          <button
            type="submit"
            className="rounded-md border border-border bg-accent px-4 py-2 text-sm font-medium text-black hover:opacity-90"
          >
            Search
          </button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">
          Tip: use effect and terpene filters on the Reviews page.
        </p>
      </section>

      <section className="rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-1)]">
        <h2 className="text-base font-medium">Quick actions</h2>
        <nav className="mt-3 grid grid-cols-1 gap-3" aria-label="Quick actions">
          <Link
            href="/reviews/new"
            className="rounded-md border border-border px-4 py-3 text-sm font-medium hover:bg-hover"
          >
            Add a review
          </Link>
          <Link
            href="/reviews"
            className="rounded-md border border-border px-4 py-3 text-sm font-medium hover:bg-hover"
          >
            Browse reviews
          </Link>
          <Link
            href="/strains"
            className="rounded-md border border-border px-4 py-3 text-sm font-medium hover:bg-hover"
          >
            Manage strains
          </Link>
          <Link
            href="/tags"
            className="rounded-md border border-border px-4 py-3 text-sm font-medium hover:bg-hover"
          >
            Manage effect & terpene tags
          </Link>
          <Link
            href="/posts"
            className="rounded-md border border-border px-4 py-3 text-sm font-medium hover:bg-hover"
          >
            Browse posts
          </Link>
          <Link
            href="/search"
            className="rounded-md border border-border px-4 py-3 text-sm font-medium hover:bg-hover"
          >
            Search
          </Link>
          <Link
            href="/me"
            className="rounded-md border border-border px-4 py-3 text-sm font-medium hover:bg-hover"
          >
            Your account
          </Link>
        </nav>
      </section>

      <section className="rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-1)]">
        <h2 className="text-base font-medium">What you can track</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Strain name + brand/grower + type</li>
          <li>Rating (1–5)</li>
          <li>Date + notes</li>
          <li>Effect + terpene tags (for filtering)</li>
        </ul>
      </section>

      <footer className="text-xs text-muted-foreground">
        Start with a review, then build your profile and follow people with similar taste.
      </footer>
    </main>
  );
}
