import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { Card, Container, PageHeader } from "@/app/_components/ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Profile",
};

function normalizeHandle(raw: string) {
  const h = raw.trim().toLowerCase();
  return h.startsWith("@") ? h : `@${h}`;
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const normalized = normalizeHandle(handle);

  const user = await prisma.user.findUnique({
    where: { handle: normalized },
    select: {
      displayName: true,
      handle: true,
      bio: true,
      avatarUrl: true,
      links: true,
    },
  });

  if (!user?.handle) notFound();

  const links =
    Array.isArray(user.links) && user.links.every((v) => typeof v === "string")
      ? (user.links as string[])
      : [];

  return (
    <Container>
      <PageHeader
        title={user.displayName ?? user.handle}
        subtitle={user.displayName ? user.handle : undefined}
        right={
          <Link href="/" className="text-sm text-neutral-600 hover:underline">
            Home
          </Link>
        }
      />

      <Card>
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 overflow-hidden rounded-full border border-neutral-200 bg-neutral-100">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>

          <div className="flex-1">
            <div className="text-sm font-medium">{user.handle}</div>
            {user.bio ? (
              <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700">
                {user.bio}
              </p>
            ) : (
              <p className="mt-2 text-sm text-neutral-500">No bio yet.</p>
            )}
          </div>
        </div>

        {links.length > 0 ? (
          <div className="mt-4">
            <h2 className="text-sm font-medium">Links</h2>
            <ul className="mt-2 space-y-2">
              {links.map((u) => (
                <li key={u}>
                  <a
                    href={u}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all text-sm text-neutral-900 underline"
                  >
                    {u}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>

      <p className="text-xs text-neutral-500">
        Note: handles are stored lowercase, so lookups are effectively case-insensitive.
      </p>
    </Container>
  );
}
