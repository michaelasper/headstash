import Link from "next/link";

import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, Container, PageHeader } from "@/app/_components/ui";
import FeedTabs from "@/app/posts/_components/FeedTabs";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Following feed",
};

function displayName(u: {
  displayName: string | null;
  handle: string | null;
  email: string | null;
}) {
  return u.displayName ?? u.handle ?? u.email ?? "Anonymous";
}

export default async function FollowingFeedPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return (
      <Container>
        <PageHeader title="Following" subtitle="Sign in to view your following feed." />
        <Card>
          <Link
            href="/auth/signin"
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-neutral-200"
          >
            Sign in
          </Link>
        </Card>
      </Container>
    );
  }

  const viewer = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });

  if (!viewer) {
    return (
      <Container>
        <PageHeader title="Following" subtitle="User not found." />
      </Container>
    );
  }

  const following = await prisma.follow.findMany({
    where: { followerId: viewer.id },
    select: { followingId: true },
    take: 500,
  });

  const followingIds = following.map((f) => f.followingId);

  return (
    <Container>
      <PageHeader
        title="Posts"
        subtitle="Posts from people you follow."
        right={
          <div className="flex items-center gap-3">
            <FeedTabs active="following" />
            <Link href="/" className="text-sm text-neutral-600 hover:underline">
              Home
            </Link>
          </div>
        }
      />

      {followingIds.length === 0 ? (
        <Card>
          <p className="text-sm text-neutral-600">
            You aren’t following anyone yet.
          </p>
          <p className="mt-2 text-xs text-neutral-500">
            Visit a public profile (/u/@handle) and tap Follow.
          </p>
        </Card>
      ) : null}

      {followingIds.length > 0 ? (
        <Card>
          {(() => {
            // Inline IIFE so we can keep the page minimal.
            // Fetch posts from followed users (cap 50).
            return null;
          })()}
          <FollowingPostsList followingIds={followingIds} viewerId={viewer.id} />
        </Card>
      ) : null}
    </Container>
  );
}

async function FollowingPostsList({
  followingIds,
  viewerId,
}: {
  followingIds: string[];
  viewerId: string;
}) {
  const posts = await prisma.post.findMany({
    where: { authorId: { in: followingIds } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 50,
    include: {
      author: {
        select: { displayName: true, handle: true, email: true, avatarUrl: true },
      },
      reactions: { where: { kind: "LIKE" }, select: { userId: true } },
      favorites: { select: { userId: true } },
      _count: { select: { reactions: true, comments: true, favorites: true } },
    },
  });

  if (posts.length === 0) {
    return (
      <div>
        <p className="text-sm text-neutral-600">No posts from followed users yet.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-neutral-200">
      {posts.map((p) => {
        const liked = p.reactions.some((r) => r.userId === viewerId);
        const favorited = p.favorites.some((f) => f.userId === viewerId);

        return (
          <li key={p.id} className="py-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 overflow-hidden rounded-full border border-neutral-200 bg-neutral-100">
                {p.author.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.author.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="truncate text-sm font-medium">
                    {p.author.handle ? (
                      <Link
                        href={`/u/${p.author.handle.replace(/^@/, "")}`}
                        className="hover:underline"
                      >
                        {displayName(p.author)}
                      </Link>
                    ) : (
                      displayName(p.author)
                    )}
                  </div>
                  <div className="shrink-0 text-xs text-neutral-500">
                    {p.createdAt.toLocaleString()}
                  </div>
                </div>

                <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-800">{p.body}</p>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div className="text-xs text-neutral-500">
                    {p._count.reactions} like{p._count.reactions === 1 ? "" : "s"} · {" "}
                    {p._count.favorites} favorite{p._count.favorites === 1 ? "" : "s"} · {" "}
                    {p._count.comments} comment{p._count.comments === 1 ? "" : "s"}
                  </div>
                  <Link
                    href={`/posts/${p.id}`}
                    className="text-sm font-medium text-neutral-900 underline"
                  >
                    View
                  </Link>
                  <span className="text-xs text-neutral-500">
                    {liked ? "Liked" : ""}{favorited ? (liked ? " · Favorited" : "Favorited") : ""}
                  </span>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
