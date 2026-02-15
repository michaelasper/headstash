import Link from "next/link";

import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handleSlug } from "@/lib/handles";
import { AppShell, AppShellNavLink, ButtonLink, Card } from "@/app/_components/ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Me",
};

export default async function MePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return (
      <AppShell
        title="Account"
        subtitle="You’re currently signed out."
        nav={
          <>
            <AppShellNavLink href="/">Home</AppShellNavLink>
            <AppShellNavLink href="/auth/signin">Sign in</AppShellNavLink>
          </>
        }
      >
        <Card>
          <ButtonLink href="/auth/signin" tone="primary">
            Sign in
          </ButtonLink>
        </Card>
      </AppShell>
    );
  }

  const email = session.user.email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, handle: true, displayName: true },
  });

  const unreadCount = user
    ? await prisma.notification.count({
        where: { userId: user.id, readAt: null },
      })
    : 0;

  // Onboarding trigger: nudge users to set a handle (required for public profile).
  // Avoid redirect loops by not applying this guard to /onboarding.
  if (!user?.handle) {
    return (
      <AppShell
        title="Welcome"
        subtitle="Let’s set up your profile."
        nav={
          <>
            <AppShellNavLink href="/">Home</AppShellNavLink>
            <AppShellNavLink href="/onboarding">Onboarding</AppShellNavLink>
          </>
        }
      >
        <Card>
          <ButtonLink href="/onboarding" tone="primary">
            Continue onboarding
          </ButtonLink>
        </Card>
      </AppShell>
    );
  }

  const [postCount, reviewCount, recentPosts] = await Promise.all([
    prisma.post.count({
      where: { author: { email } },
    }),
    prisma.review.count({
      where: { userId: user.id },
    }),
    prisma.post.findMany({
      where: { author: { email } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 3,
      select: {
        id: true,
        body: true,
        createdAt: true,
        _count: {
          select: {
            comments: true,
            favorites: true,
          },
        },
      },
    }),
  ]);

  return (
    <AppShell
      title="Dashboard"
      subtitle={user.displayName ?? user.handle ?? "Session info"}
      nav={
        <>
          <AppShellNavLink href="/posts">Posts</AppShellNavLink>
          <AppShellNavLink href="/me/favorites">Favorites</AppShellNavLink>
          <AppShellNavLink href="/notifications">
            Notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}
          </AppShellNavLink>
          <AppShellNavLink href="/search">Search</AppShellNavLink>
          <AppShellNavLink href="/profile">Profile</AppShellNavLink>
        </>
      }
    >
      <Card className="group relative overflow-hidden border-neutral-800 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-800 text-white transition duration-300 hover:-translate-y-0.5 hover:shadow-2xl">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-white/10 blur-3xl transition duration-500 group-hover:scale-110"
        />

        <p className="relative text-xs uppercase tracking-[0.18em] text-neutral-300">Tonight’s pulse</p>
        <h2 className="relative mt-2 text-2xl font-semibold tracking-tight">
          {user.displayName ?? user.handle}, your social dashboard is live.
        </h2>
        <p className="relative mt-2 max-w-2xl text-sm text-neutral-300">
          Keep momentum with fresh posts, tighten your profile voice, and jump into high-signal conversations.
        </p>

        <div className="relative mt-4 flex flex-wrap gap-2">
          <ButtonLink href="/posts">Open feed</ButtonLink>
          <Link
            href={`/u/${handleSlug(user.handle)}`}
            className="rounded-lg border border-neutral-600 bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-100 transition hover:-translate-y-0.5 hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500"
          >
            View public profile
          </Link>
          <ButtonLink href="/profile">Edit profile</ButtonLink>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Posts published</p>
          <p className="mt-1 text-2xl font-semibold">{postCount}</p>
          <p className="mt-1 text-xs text-neutral-500">Original updates shared to your network.</p>
        </Card>

        <Card className="transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Reviews logged</p>
          <p className="mt-1 text-2xl font-semibold">{reviewCount}</p>
          <p className="mt-1 text-xs text-neutral-500">Structured strain notes with ratings and context.</p>
        </Card>

        <Card className="transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <p className="flex items-center gap-1 text-xs uppercase tracking-wide text-neutral-500">
            Unread notifications
            {unreadCount > 0 ? <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500" /> : null}
          </p>
          <p className="mt-1 text-2xl font-semibold">{unreadCount}</p>
          <p className="mt-1 text-xs text-neutral-500">Replies, favorites, and follow activity waiting on you.</p>
        </Card>
      </div>

      <Card className="transition duration-300 hover:shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold">Recent activity</h3>
            <p className="text-xs text-neutral-500">Your latest posts and their conversation signals.</p>
          </div>
          <ButtonLink href="/api/auth/signout">Sign out</ButtonLink>
        </div>

        {recentPosts.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-600">No posts yet. Share a first update to start your story arc.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {recentPosts.map((post) => (
              <li
                key={post.id}
                className="rounded-lg border border-neutral-200 bg-white p-3 transition duration-200 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-sm"
              >
                <Link href={`/posts/${post.id}`} className="text-sm font-medium underline decoration-2 underline-offset-2">
                  {post.body.length > 100 ? `${post.body.slice(0, 100)}…` : post.body}
                </Link>
                <div className="mt-2 text-xs text-neutral-500">
                  {post.createdAt.toLocaleString()} · {post._count.comments} comment{post._count.comments === 1 ? "" : "s"} · {" "}
                  {post._count.favorites} favorite{post._count.favorites === 1 ? "" : "s"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AppShell>
  );
}
