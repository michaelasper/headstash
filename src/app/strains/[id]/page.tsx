import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { Card, Container, PageHeader } from "@/app/_components/ui";

export const metadata = {
  title: "Strain",
};

export default async function StrainDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const strain = await prisma.strain.findUnique({
    where: { id },
  });

  if (!strain) notFound();

  const reviews = await prisma.review.findMany({
    where: { strainId: id },
    orderBy: [{ createdAt: "desc" }],
    take: 50,
  });

  return (
    <Container>
      <PageHeader
        title={strain.name}
        subtitle={strain.brand ?? undefined}
        right={
          <Link href="/strains" className="text-sm text-neutral-600 hover:underline">
            Back
          </Link>
        }
      />

      <Card>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-neutral-500">Type</dt>
            <dd className="font-medium">{strain.type ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-500">Created</dt>
            <dd className="font-medium">
              {new Date(strain.createdAt).toLocaleDateString()}
            </dd>
          </div>
        </dl>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium">Reviews</h2>
          <Link
            href="/reviews/new"
            className="text-sm font-medium text-neutral-900 hover:underline"
          >
            Add
          </Link>
        </div>

        {reviews.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-600">No reviews for this strain yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200">
            {reviews.map((r) => (
              <li key={r.id} className="py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="font-medium">{r.rating}</div>
                  <div className="text-xs text-neutral-500">
                    {(r.consumedAt ?? r.createdAt).toLocaleDateString()}
                  </div>
                </div>
                {r.notes ? (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700">
                    {r.notes}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Container>
  );
}
