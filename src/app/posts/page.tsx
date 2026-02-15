import Link from "next/link";

import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppShell, AppShellNavLink, Card, buttonClassName } from "@/app/_components/ui";
import PostComposer from "@/app/posts/postComposer";
import FeedTabs from "@/app/posts/_components/FeedTabs";
import { toggleLike } from "@/app/posts/reactions";
import { toggleFavoritePost } from "@/app/posts/favorites";
import { SocialProfileInline } from "@/app/_components/socialProfileCard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Posts",
};

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

  const peopleToFollow = Array.from(
    posts
      .reduce((acc, post) => {
        const authorEmail = post.author.email?.toLowerCase() ?? null;
        if (!authorEmail || (viewerEmail && authorEmail === viewerEmail)) {
          return acc;
        }

        const existing = acc.get(authorEmail);
        if (existing) {
          existing.postCount += 1;
        } else {
          acc.set(authorEmail, {
            email: authorEmail,
            displayName: post.author.displayName,
            handle: post.author.handle,
            postCount: 1,
          });
        }

        return acc;
      }, new Map<string, { email: string; displayName: string | null; handle: string | null; postCount: number }>())
      .values(),
  )
    .sort((a, b) => b.postCount - a.postCount)
    .slice(0, 4);

  const trendingStrains = Array.from(
    posts
      .reduce((acc, post) => {
        const strainName = post.review?.strain.name;
        if (!strainName) return acc;
        acc.set(strainName, (acc.get(strainName) ?? 0) + 1);
        return acc;
      }, new Map<string, number>())
      .entries(),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const activeDiscussions = [...posts]
    .filter((post) => post._count.comments > 0)
    .sort((a, b) => {
      if (b._count.comments !== a._count.comments) {
        return b._count.comments - a._count.comments;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    })
    .slice(0, 3);

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

      <Card>
        <h2 className="text-sm font-medium">Discover</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">People to follow</h3>
            {peopleToFollow.length === 0 ? (
              <p className="text-sm text-muted-foreground">More member suggestions appear as activity grows.</p>
            ) : (
              <ul className="space-y-1.5">
                {peopleToFollow.map((person) => (
                  <li key={person.email} className="text-sm text-foreground">
                    <span className="font-medium">{person.handle ? `@${person.handle}` : person.displayName ?? "Member"}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {person.postCount} recent post{person.postCount === 1 ? "" : "s"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Trending strains</h3>
            {trendingStrains.length === 0 ? (
              <p className="text-sm text-muted-foreground">Trending strain data will appear after review-linked posts land.</p>
            ) : (
              <ul className="space-y-1.5">
                {trendingStrains.map(([strainName, count]) => (
                  <li key={strainName} className="text-sm text-foreground">
                    <span className="font-medium">{strainName}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {count} mention{count === 1 ? "" : "s"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active discussions</h3>
            {activeDiscussions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active threads yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {activeDiscussions.map((post) => (
                  <li key={post.id} className="text-sm">
                    <Link href={`/posts/${post.id}`} className="font-medium text-foreground underline">
                      {post.author.handle ? `@${post.author.handle}` : post.author.displayName ?? "Member"}
                    </Link>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {post._count.comments} comment{post._count.comments === 1 ? "" : "s"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
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
              <p className="text-xs text-muted-foreground">Sign in to create the first post.</p>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {posts.map((p) => {
              const liked = viewer ? p.reactions.some((r) => r.userId === viewer.id) : false;
              const favorited = viewer ? p.favorites.some((f) => f.userId === viewer.id) : false;

              return (
                <li key={p.id} className="px-4 py-3">
                  <div className="flex flex-col gap-2">
                    <SocialProfileInline
                      author={p.author}
                      timestamp={p.createdAt.toLocaleString()}
                      meta={
                        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide">
                          member
                        </span>
                      }
                    />

                    <p className="pl-[52px] whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                      {p.body}
                    </p>

                    {p.review ? (
                      <div className="mt-2.5 rounded-lg border border-border bg-muted p-3">
                        <div className="text-sm font-medium leading-tight">
                          {p.review.strain.name} · {p.review.rating}
                        </div>
                        <div className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                          {p.review.consumedAt ? p.review.consumedAt.toLocaleDateString() : "Date not added"}
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
                              className={buttonClassName(liked ? "primary" : "default")}
                            >
                              {liked ? "Liked" : "Like"}
                            </button>
                          </form>

                          <form action={toggleFavoritePost}>
                            <input type="hidden" name="postId" value={p.id} />
                            <button
                              type="submit"
                              className={buttonClassName(favorited ? "primary" : "default")}
                            >
                              {favorited ? "Favorited" : "Favorite"}
                            </button>
                          </form>
                        </>
                      ) : (
                        <Link href="/auth/signin" className="text-sm font-medium text-foreground underline">
                          Sign in to react
                        </Link>
                      )}

                      <Link href={`/posts/${p.id}`} className="text-sm font-medium text-foreground underline">
                        View ({p._count.comments} comment{p._count.comments === 1 ? "" : "s"})
                      </Link>

                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        {p._count.reactions} like{p._count.reactions === 1 ? "" : "s"} · {" "}
                        {p._count.favorites} favorite{p._count.favorites === 1 ? "" : "s"}
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
