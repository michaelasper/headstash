import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { ButtonLink, Card, Container, PageHeader } from "@/app/_components/ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Strains",
};

export default async function StrainsPage() {
  const strains = await prisma.strain.findMany({
    orderBy: [{ updatedAt: "desc" }],
    take: 100,
  });

  return (
    <Container>
      <PageHeader
        title="Strains"
        subtitle="Your strain catalog (name, brand/grower, type)."
        right={<ButtonLink href="/strains/new">New</ButtonLink>}
      />

      <Card>
        {strains.length === 0 ? (
          <p className="text-sm text-neutral-600">
            No strains yet. Add one to start.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {strains.map((s) => (
              <li key={s.id} className="py-3">
                <Link
                  href={`/strains/${s.id}`}
                  className="block rounded-md px-1 py-1 hover:bg-neutral-50"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-neutral-500">
                      {s.type ?? "—"}
                    </div>
                  </div>
                  {s.brand ? (
                    <div className="text-sm text-neutral-600">{s.brand}</div>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="text-xs text-neutral-500">
        Tip: reviews reference a strain, so create strains first.
      </p>
    </Container>
  );
}
