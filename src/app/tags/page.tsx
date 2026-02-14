import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { ButtonLink, Card, Container, PageHeader } from "@/app/_components/ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tags",
};

export default async function TagsPage() {
  const tags = await prisma.tag.findMany({
    orderBy: [{ kind: "asc" }, { name: "asc" }],
    take: 500,
  });

  return (
    <Container>
      <PageHeader
        title="Tags"
        subtitle="Create effect and terpene tags to organize your reviews."
        right={<ButtonLink href="/tags/new">New</ButtonLink>}
      />

      <Card>
        {tags.length === 0 ? (
          <p className="text-sm text-neutral-600">
            No tags yet. Add a couple effects/terpenes to enable filters.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {tags.map((t) => (
              <li key={t.id} className="py-2 text-sm">
                <span className="mr-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
                  {t.kind}
                </span>
                {t.name}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="text-xs text-neutral-500">
        Tip: create tags first, then select them when adding a review.
      </p>

      <Link href="/" className="text-sm text-neutral-600 hover:underline">
        ← Home
      </Link>
    </Container>
  );
}
