import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { createReview } from "@/app/actions";
import {
  Card,
  Container,
  Field,
  PageHeader,
  inputClassName,
} from "@/app/_components/ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "New review",
};

export default async function NewReviewPage() {
  const [strains, effectTags, terpeneTags] = await Promise.all([
    prisma.strain.findMany({
      orderBy: [{ name: "asc" }],
      take: 500,
    }),
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
  ]);

  return (
    <Container>
      <PageHeader
        title="New review"
        subtitle="Capture the basics: strain, rating, date, notes."
        right={
          <Link href="/reviews" className="text-sm text-neutral-600 hover:underline">
            Back
          </Link>
        }
      />

      <Card>
        {strains.length === 0 ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-neutral-600">
              You need at least one strain before creating a review.
            </p>
            <Link
              href="/strains/new"
              className="rounded-lg bg-neutral-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-neutral-800"
            >
              Create a strain
            </Link>
          </div>
        ) : (
          <form action={createReview} className="flex flex-col gap-4">
            <Field label="Strain">
              <select name="strainId" className={inputClassName} required>
                {strains.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.brand ? ` — ${s.brand}` : ""}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Rating">
              <select name="rating" className={inputClassName} required>
                <option value="ONE">1</option>
                <option value="TWO">2</option>
                <option value="THREE">3</option>
                <option value="FOUR">4</option>
                <option value="FIVE">5</option>
              </select>
            </Field>

            <Field label="Date" hint="Optional">
              <input
                name="consumedAt"
                type="date"
                className={inputClassName}
              />
            </Field>

            <Field label="Effect" hint="Optional">
              <select name="effectTagId" className={inputClassName} defaultValue="">
                <option value="">—</option>
                {effectTags.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Terpene" hint="Optional">
              <select
                name="terpeneTagId"
                className={inputClassName}
                defaultValue=""
              >
                <option value="">—</option>
                {terpeneTags.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Notes" hint="Optional">
              <textarea
                name="notes"
                className={inputClassName}
                rows={5}
                placeholder="Flavor, effects, vibe, anything worth remembering…"
              />
            </Field>

            <div className="text-xs text-neutral-500">
              Need more tags? <Link href="/tags/new" className="underline">Add a tag</Link>
            </div>

            <button
              type="submit"
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Save review
            </button>
          </form>
        )}
      </Card>

      <p className="text-xs text-neutral-500">
        Note: without auth yet, reviews are stored under a local dev user.
      </p>
    </Container>
  );
}
