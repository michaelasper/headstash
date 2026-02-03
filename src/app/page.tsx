import Link from "next/link";

import { Card, Container, inputClassName } from "@/app/_components/ui";

export default function Home() {
  return (
    <Container>
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold leading-[var(--lh-heading)] tracking-tight">
          Headstash
        </h1>
        <p className="text-sm text-neutral-600">
          A simple, mobile-first stash for cannabis strain reviews.
        </p>
      </header>

      <Card>
        <h2 className="text-base font-medium">Find reviews</h2>
        <form action="/reviews" method="get" className="mt-3 flex gap-2">
          <input
            name="q"
            className={inputClassName}
            placeholder="Search strain name or notes…"
            inputMode="search"
          />
          <button
            type="submit"
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
          >
            Search
          </button>
        </form>
        <p className="mt-2 text-xs text-neutral-500">
          Tip: filter by Effect / Terpene on the Reviews page.
        </p>
      </Card>

      <Card>
        <h2 className="text-base font-medium">Quick actions</h2>
        <div className="mt-3 grid grid-cols-1 gap-3">
          <Link
            href="/reviews/new"
            className="rounded-lg border border-neutral-200 px-4 py-3 text-sm font-medium hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
          >
            Add a review
          </Link>
          <Link
            href="/reviews"
            className="rounded-lg border border-neutral-200 px-4 py-3 text-sm font-medium hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
          >
            View reviews (search + filters)
          </Link>
          <Link
            href="/strains"
            className="rounded-lg border border-neutral-200 px-4 py-3 text-sm font-medium hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
          >
            Manage strains
          </Link>
          <Link
            href="/tags"
            className="rounded-lg border border-neutral-200 px-4 py-3 text-sm font-medium hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
          >
            Manage tags (effects / terpenes)
          </Link>
          <Link
            href="/posts"
            className="rounded-lg border border-neutral-200 px-4 py-3 text-sm font-medium hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
          >
            Posts (feed)
          </Link>
          <Link
            href="/search"
            className="rounded-lg border border-neutral-200 px-4 py-3 text-sm font-medium hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
          >
            Search
          </Link>
          <Link
            href="/me"
            className="rounded-lg border border-neutral-200 px-4 py-3 text-sm font-medium hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
          >
            Account
          </Link>
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-medium">What you can track (v1)</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-neutral-700">
          <li>Strain name + brand/grower + type</li>
          <li>Rating (1–5)</li>
          <li>Date + notes</li>
          <li>Effect + terpene tags (for filtering)</li>
        </ul>
      </Card>

      <footer className="text-xs text-neutral-500">
        No accounts yet. This is local/dev-friendly and evolves from here.
      </footer>
    </Container>
  );
}
