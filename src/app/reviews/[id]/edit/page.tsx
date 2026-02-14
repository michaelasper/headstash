import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { updateReview } from "@/app/actions";
import {
  Card,
  Container,
  Field,
  PageHeader,
  inputClassName,
  buttonClassName,
} from "@/app/_components/ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Edit review",
};

function toDateInputValue(d: Date | null) {
  if (!d) return "";
  // yyyy-mm-dd in local time
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default async function EditReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      strain: true,
      tags: { include: { tag: true } },
    },
  });

  if (!review) notFound();

  const [effectTags, terpeneTags] = await Promise.all([
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

  const currentEffect =
    review.tags.find((rt) => rt.tag.kind === "EFFECT")?.tagId ?? "";
  const currentTerpene =
    review.tags.find((rt) => rt.tag.kind === "TERPENE")?.tagId ?? "";

  return (
    <Container>
      <PageHeader
        title="Edit review"
        subtitle={`Strain: ${review.strain.name}`}
        right={
          <Link href="/reviews" className="text-sm text-neutral-600 hover:underline">
            Back
          </Link>
        }
      />

      <Card>
        <form action={updateReview} className="flex flex-col gap-4">
          <input type="hidden" name="reviewId" value={review.id} />

          <Field label="Rating">
            <select
              name="rating"
              className={inputClassName}
              required
              defaultValue={review.rating}
            >
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
              defaultValue={toDateInputValue(review.consumedAt)}
            />
          </Field>

          <Field label="Effect" hint="Optional">
            <select
              name="effectTagId"
              className={inputClassName}
              defaultValue={currentEffect}
            >
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
              defaultValue={currentTerpene}
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
              rows={6}
              defaultValue={review.notes ?? ""}
            />
          </Field>

          <button type="submit" className={buttonClassName("primary")}>
            Save changes
          </button>
        </form>
      </Card>

      <p className="text-xs text-neutral-500">
        Strain editing is intentionally out of scope for this screen (v1).
      </p>
    </Container>
  );
}
