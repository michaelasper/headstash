import Link from "next/link";

import { prisma } from "@/lib/prisma";
import {
  ButtonLink,
  Card,
  Container,
  PageHeader,
  inputClassName,
} from "@/app/_components/ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reviews",
};

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
      {children}
    </span>
  );
}

function isAnyFilterActive({
  q,
  effect,
  terpene,
}: {
  q: string;
  effect: string;
  terpene: string;
}) {
  return q.trim().length > 0 || effect.length > 0 || terpene.length > 0;
}

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; effect?: string; terpene?: string }>;
}) {
  const { q = "", effect = "", terpene = "" } = await searchParams;
  const anyFilterActive = isAnyFilterActive({ q, effect, terpene });

  const [effectTags, terpeneTags, reviews] = await Promise.all([
    prisma.tag.findMany({
      where: { kind: "EFFECT" },
      orderBy: [{ name: "asc" }],
      take: 200,
    }),
    prisma.tag.findMany({
      where: { kind: "TERPENE" },
      orderBy: [{ name: "asc" }],
      take: 200,
    }),
    prisma.review.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: 200,
      include: {
        strain: true,
        tags: { include: { tag: true } },
      },
      where: {
        AND: [
          q
            ? {
                OR: [
                  { strain: { is: { name: { contains: q } } } },
                  { notes: { contains: q } },
                ],
              }
            : {},
          effect
            ? {
                tags: {
                  some: {
                    tagId: effect,
                  },
                },
              }
            : {},
          terpene
            ? {
                tags: {
                  some: {
                    tagId: terpene,
                  },
                },
              }
            : {},
        ],
      },
    }),
  ]);

  return (
    <Container>
      <div className="sticky top-0 z-10 -mx-4 border-b border-neutral-200 bg-white/90 px-4 py-4 backdrop-blur">
        <PageHeader
          title="Reviews"
          subtitle="Search and filter your recent entries."
          right={<ButtonLink href="/reviews/new">New</ButtonLink>}
        />
      </div>

      <Card>
        <form className="flex flex-col gap-4" method="get">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Search</span>
            <input
              name="q"
              className={inputClassName}
              placeholder="Strain name or notes…"
              defaultValue={q}
              inputMode="search"
            />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Effect</span>
              <select
                name="effect"
                className={inputClassName}
                defaultValue={effect}
              >
                <option value="">All</option>
                {effectTags.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {effectTags.length === 0 ? (
                <span className="text-xs text-neutral-500">
                  No effect tags yet. <Link href="/tags/new" className="underline">Add one</Link>.
                </span>
              ) : null}
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Terpene</span>
              <select
                name="terpene"
                className={inputClassName}
                defaultValue={terpene}
              >
                <option value="">All</option>
                {terpeneTags.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {terpeneTags.length === 0 ? (
                <span className="text-xs text-neutral-500">
                  No terpene tags yet. <Link href="/tags/new" className="underline">Add one</Link>.
                </span>
              ) : null}
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
            >
              Apply
            </button>

            <Link
              href="/reviews"
              className={`rounded-lg px-3 py-2 text-sm font-medium hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2 ${
                anyFilterActive ? "text-neutral-900" : "text-neutral-400"
              }`}
              aria-disabled={!anyFilterActive}
              tabIndex={anyFilterActive ? 0 : -1}
            >
              Clear filters
            </Link>

            <div className="ml-auto text-xs text-neutral-500">
              {reviews.length} result{reviews.length === 1 ? "" : "s"}
            </div>
          </div>

          {!anyFilterActive ? (
            <div className="text-xs text-neutral-500">
              Tip: add a couple tags, then filter reviews by Effect/Terpene.
            </div>
          ) : null}
        </form>
      </Card>

      <Card>
        {reviews.length === 0 ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-neutral-600">
              {anyFilterActive
                ? "No results for the current filters."
                : "No reviews yet."}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/reviews/new"
                className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
              >
                Add a review
              </Link>
              {anyFilterActive ? (
                <Link
                  href="/reviews"
                  className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
                >
                  Clear filters
                </Link>
              ) : null}
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {reviews.map((r) => {
              const effectNames = r.tags
                .filter((rt) => rt.tag.kind === "EFFECT")
                .map((rt) => rt.tag.name);
              const terpeneNames = r.tags
                .filter((rt) => rt.tag.kind === "TERPENE")
                .map((rt) => rt.tag.name);

              return (
                <li key={r.id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{r.strain.name}</div>
                      <div className="text-sm text-neutral-600">
                        {r.strain.brand ? `${r.strain.brand} · ` : ""}
                        {r.strain.type ?? "—"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{r.rating}</div>
                      <div className="text-xs text-neutral-500">
                        {(r.consumedAt ?? r.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {(effectNames.length > 0 || terpeneNames.length > 0) && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {effectNames.map((n) => (
                        <Chip key={`e:${n}`}>{n}</Chip>
                      ))}
                      {terpeneNames.map((n) => (
                        <Chip key={`t:${n}`}>{n}</Chip>
                      ))}
                    </div>
                  )}

                  {r.notes ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700">
                      {r.notes}
                    </p>
                  ) : null}

                  <div className="mt-2 flex items-center gap-4">
                    <Link
                      href={`/strains/${r.strainId}`}
                      className="text-xs font-medium text-neutral-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
                    >
                      View strain
                    </Link>
                    <Link
                      href={`/reviews/${r.id}/edit`}
                      className="text-xs font-medium text-neutral-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
                    >
                      Edit
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </Container>
  );
}
