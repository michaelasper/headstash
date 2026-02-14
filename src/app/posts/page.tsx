import Link from "next/link";

import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppShell, AppShellNavLink, Card } from "@/app/_components/ui";
import PostComposer from "@/app/posts/postComposer";
import FeedTabs from "@/app/posts/_components/FeedTabs";
import { toggleLike } from "@/app/posts/reactions";
import { toggleFavoritePost } from "@/app/posts/favorites";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Posts",
};

function displayName(u: {
  displayName: string | null;
  handle: string | null;
  email: string | null;
}) {
  return u.displayName ?? u.handle ?? u.email ?? "Anonymous";
}

export default async function PostsPage() {
  const session = await getServerSession(authOptions);
  const viewerEmail = session?.user?.email?.toLowerCase() ?? null;

  const viewer = viewerEmail
    ? await prisma.user.findUnique({
        where: { email: viewerEmail },
        select: { id: true },
      })
    : null;

  const [reviews, posts] = await Promise.all([
    viewer
      ? prisma.review.findMany({
          where: { userId: viewer.id },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: 50,
          include: { strain: true },
        })
      : Promise.resolve([]),
    prisma.post.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 100,
    include: {
      author: {
        select: {
          displayName: true,
          handle: true,
          email: true,
          avatarUrl: true,
        },
      },
      reactions: {
        where: { kind: "LIKE" },
        select: { userId: true },
      },
      favorites: {
        select: { userId: true },
      },
      review: {
        include: {
          strain: true,
          user: { select: { id: true } },
        },
      },
      _count: {
        select: { reactions: true, comments: true, favorites: true },
      },
    },
  }),
  ]);

  return (
    <AppShell
      title="Posts"
      subtitle="See what people are sharing and add your own take."
      nav={
        <>
          <AppShellNavLink href="/">Home</AppShellNavLink>
          <AppShellNavLink href="/posts/following">Following</AppShellNavLink>
          <AppShellNavLink href="/reviews">Reviews</AppShellNavLink>
          <AppShellNavLink href="/search">Search</AppShellNavLink>
        </>
      }
    >
      <div className="flex items-center justify-between gap-3">
        <FeedTabs active="global" />
      </div>

      <Card>
        {session?.user?.email ? (
          <PostComposer
            reviews={reviews.map((r) => ({
              id: r.id,
              label: `${r.strain.name} · ${r.rating}`,
            }))}
          />
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Sign in to create posts.</p>
            <Link
              href="/auth/signin"
              className="rounded-lg border border-border bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
            >
              Sign in
            </Link>
          </div>
        )}
      </Card>

      <Card className="p-0">
        {posts.length === 0 ? (
          <div className="flex flex-col gap-2 p-4">
            <p className="text-sm text-muted-foreground">No posts yet.</p>
            {session?.user?.email ? (
              <p className="text-xs text-muted-foreground">
                Be the first to share a note, strain take, or quick review.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Sign in to create the first post.
              </p>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {posts.map((p) => {
              const liked = viewer
                ? p.reactions.some((r) => r.userId === viewer.id)
                : false;
              const favorited = viewer
                ? p.favorites.some((f) => f.userId === viewer.id)
                : false;

              return (
                <li key={p.id} className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-full border border-border bg-muted">
                      {p.author.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.author.avatarUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
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

                      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                        {p.body}
                      </p>

                      {p.review ? (
                        <div className="mt-2.5 rounded-lg border border-border bg-muted p-3">
                          <div className="text-sm font-medium leading-tight">
                            {p.review.strain.name} · {p.review.rating}
                          </div>
                          <div className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                            {p.review.consumedAt
                              ? p.review.consumedAt.toLocaleDateString()
                              : "Date not added"}
                          </div>
                          {p.review.notes ? (
                            <div className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">
                              {p.review.notes}
                            </div>
                          ) : null}
                          <div className="mt-2">
                            <Link
                              href={`/reviews/${p.review.id}/edit`}
                              className="text-xs font-medium text-foreground underline"
                            >
                              View review
                            </Link>
                          </div>
                        </div>
                      ) : null}

                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        {viewer ? (
                          <>
                            <form action={toggleLike}>
                              <input type="hidden" name="postId" value={p.id} />
                              <button
                                type="submit"
                                className={`rounded-lg border px-3 py-1 text-sm font-medium ${
                                  liked
                                    ? "border-foreground bg-foreground text-background"
                                    : "border-border bg-card text-foreground hover:bg-hover"
                                }`}
                              >
                                {liked ? "Liked" : "Like"}
                              </button>
                            </form>

                            <form action={toggleFavoritePost}>
                              <input type="hidden" name="postId" value={p.id} />
                              <button
                                type="submit"
                                className={`rounded-lg border px-3 py-1 text-sm font-medium ${
                                  favorited
                                    ? "border-foreground bg-foreground text-background"
                                    : "border-border bg-card text-foreground hover:bg-hover"
                                }`}
                              >
                                {favorited ? "Favorited" : "Favorite"}
                              </button>
                            </form>
                          </>
                        ) : (
                          <Link
                            href="/auth/signin"
                            className="text-sm font-medium text-foreground underline"
                          >
                            Sign in to react
                          </Link>
                        )}

                        <Link
                          href={`/posts/${p.id}`}
                          className="text-sm font-medium text-foreground underline"
                        >
                          View ({p._count.comments} comment{p._count.comments === 1 ? "" : "s"})
                        </Link>

                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          {p._count.reactions} like{p._count.reactions === 1 ? "" : "s"} · {" "}
                          {p._count.favorites} favorite{p._count.favorites === 1 ? "" : "s"}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </AppShell>
  );
}
