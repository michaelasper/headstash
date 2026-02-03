import Link from "next/link";
import { notFound } from "next/navigation";

import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { followUser, unfollowUser } from "@/app/follow/actions";
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

  const session = await getServerSession(authOptions);
  const sessionEmail = session?.user?.email?.toLowerCase() ?? null;

  const user = await prisma.user.findUnique({
    where: { handle: normalized },
    select: {
      id: true,
      email: true,
      displayName: true,
      handle: true,
      bio: true,
      avatarUrl: true,
      links: true,
    },
  });

  if (!user?.handle) notFound();

  const viewer = sessionEmail
    ? await prisma.user.findUnique({
        where: { email: sessionEmail },
        select: { id: true, handle: true },
      })
    : null;

  const [followersCount, followingCount, isFollowing] = await Promise.all([
    prisma.follow.count({ where: { followingId: user.id } }),
    prisma.follow.count({ where: { followerId: user.id } }),
    viewer
      ? prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: viewer.id,
              followingId: user.id,
            },
          },
          select: { followerId: true },
        })
      : Promise.resolve(null),
  ]);

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

            <div className="mt-1 flex flex-wrap gap-3 text-xs text-neutral-500">
              <span>
                <span className="font-medium text-neutral-900">{followersCount}</span>{" "}
                followers
              </span>
              <span>
                <span className="font-medium text-neutral-900">{followingCount}</span>{" "}
                following
              </span>
            </div>

            {viewer && viewer.id !== user.id ? (
              <div className="mt-3">
                {isFollowing ? (
                  <form action={unfollowUser}>
                    <input type="hidden" name="handle" value={user.handle} />
                    <button
                      type="submit"
                      className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-neutral-200"
                    >
                      Unfollow
                    </button>
                  </form>
                ) : (
                  <form action={followUser}>
                    <input type="hidden" name="handle" value={user.handle} />
                    <button
                      type="submit"
                      className="rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-neutral-200"
                    >
                      Follow
                    </button>
                  </form>
                )}
              </div>
            ) : !viewer ? (
              <div className="mt-3">
                <Link
                  href="/auth/signin"
                  className="text-sm font-medium text-neutral-900 underline"
                >
                  Sign in to follow
                </Link>
              </div>
            ) : null}

            {user.bio ? (
              <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-700">
                {user.bio}
              </p>
            ) : (
              <p className="mt-3 text-sm text-neutral-500">No bio yet.</p>
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
