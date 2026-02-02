import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { ButtonLink, Card, Container, PageHeader } from "@/app/_components/ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reviews",
};

export default async function ReviewsPage() {
  const reviews = await prisma.review.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 100,
    include: { strain: true },
  });

  return (
    <Container>
      <PageHeader
        title="Reviews"
        subtitle="Recent entries (no auth yet — stored under a local user)."
        right={<ButtonLink href="/reviews/new">New</ButtonLink>}
      />

      <Card>
        {reviews.length === 0 ? (
          <p className="text-sm text-neutral-600">
            No reviews yet. Create a strain, then add a review.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {reviews.map((r) => (
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
            ))}
          </ul>
        )}
      </Card>
    </Container>
  );
}
