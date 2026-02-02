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

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; effect?: string; terpene?: string }>;
}) {
  const { q = "", effect = "", terpene = "" } = await searchParams;

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
      <PageHeader
        title="Reviews"
        subtitle="Search and filter your recent entries."
        right={<ButtonLink href="/reviews/new">New</ButtonLink>}
      />

      <Card>
        <form className="flex flex-col gap-3" method="get">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Search</span>
            <input
              name="q"
              className={inputClassName}
              placeholder="Strain name or notes…"
              defaultValue={q}
            />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Effect</span>
              <select name="effect" className={inputClassName} defaultValue={effect}>
                <option value="">All</option>
                {effectTags.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
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
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Apply
            </button>
            <Link href="/reviews" className="text-sm text-neutral-600 hover:underline">
              Reset
            </Link>
            <div className="ml-auto text-xs text-neutral-500">
              {reviews.length} result{reviews.length === 1 ? "" : "s"}
            </div>
          </div>

          <div className="text-xs text-neutral-500">
            Need tags? <Link href="/tags" className="underline">Manage tags</Link>
          </div>
        </form>
      </Card>

      <Card>
        {reviews.length === 0 ? (
          <p className="text-sm text-neutral-600">
            No matching reviews. Try clearing filters.
          </p>
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

                  <div className="mt-2">
                    <Link
                      href={`/strains/${r.strainId}`}
                      className="text-xs font-medium text-neutral-900 hover:underline"
                    >
                      View strain
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
