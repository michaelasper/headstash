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
            className="rounded-lg border border-border bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
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
          <div className="flex items-center gap-2">
            <FeedTabs active="following" />
            <Link href="/" className="text-sm text-muted-foreground hover:underline">
              Home
            </Link>
          </div>
        }
      />

      {followingIds.length === 0 ? (
        <Card>
          <p className="text-sm text-muted-foreground">
            You aren’t following anyone yet.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Visit a public profile (/u/@handle) and tap Follow.
          </p>
        </Card>
      ) : null}

      {followingIds.length > 0 ? (
        <Card className="p-0">
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
      <div className="p-4">
        <p className="text-sm text-muted-foreground">No posts from followed users yet.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {posts.map((p) => {
        const liked = p.reactions.some((r) => r.userId === viewerId);
        const favorited = p.favorites.some((f) => f.userId === viewerId);

        return (
          <li key={p.id} className="px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 overflow-hidden rounded-full border border-border bg-muted">
                {p.author.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.author.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="truncate text-sm font-medium leading-tight">
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
                  <div className="shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground">
                    {p.createdAt.toLocaleString()}
                  </div>
                </div>

                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{p.body}</p>

                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {p._count.reactions} like{p._count.reactions === 1 ? "" : "s"} · {" "}
                    {p._count.favorites} favorite{p._count.favorites === 1 ? "" : "s"} · {" "}
                    {p._count.comments} comment{p._count.comments === 1 ? "" : "s"}
                  </div>
                  <Link
                    href={`/posts/${p.id}`}
                    className="text-sm font-medium text-foreground underline"
                  >
                    View
                  </Link>
                  <span className="text-xs text-muted-foreground">
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
