import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Headstash</h1>
        <p className="text-sm text-neutral-600">
          A simple, mobile-first stash for cannabis strain reviews.
        </p>
      </header>

      <section className="rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="text-base font-medium">Find reviews</h2>
        <form action="/reviews" method="get" className="mt-3 flex gap-2">
          <input
            name="q"
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400"
            placeholder="Search strain name or notes…"
          />
          <button
            type="submit"
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Search
          </button>
        </form>
        <p className="mt-2 text-xs text-neutral-500">
          Tip: filter by Effect / Terpene on the Reviews page.
        </p>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="text-base font-medium">Quick actions</h2>
        <div className="mt-3 grid grid-cols-1 gap-3">
          <Link
            href="/reviews/new"
            className="rounded-lg border border-neutral-200 px-4 py-3 text-sm font-medium hover:bg-neutral-50"
          >
            Add a review
          </Link>
          <Link
            href="/reviews"
            className="rounded-lg border border-neutral-200 px-4 py-3 text-sm font-medium hover:bg-neutral-50"
          >
            View reviews (search + filters)
          </Link>
          <Link
            href="/strains"
            className="rounded-lg border border-neutral-200 px-4 py-3 text-sm font-medium hover:bg-neutral-50"
          >
            Manage strains
          </Link>
          <Link
            href="/tags"
            className="rounded-lg border border-neutral-200 px-4 py-3 text-sm font-medium hover:bg-neutral-50"
          >
            Manage tags (effects / terpenes)
          </Link>
          <Link
            href="/me"
            className="rounded-lg border border-neutral-200 px-4 py-3 text-sm font-medium hover:bg-neutral-50"
          >
            Account (auth foundation)
          </Link>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="text-base font-medium">What you can track (v1)</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-neutral-700">
          <li>Strain name + brand/grower + type</li>
          <li>Rating (1–5)</li>
          <li>Date + notes</li>
          <li>Effect + terpene tags (for filtering)</li>
        </ul>
      </section>

      <footer className="text-xs text-neutral-500">
        No accounts yet. This is local/dev-friendly and evolves from here.
      </footer>
    </main>
  );
}
