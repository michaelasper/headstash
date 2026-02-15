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
      <Card className="border-neutral-800 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-800 text-white">
        <p className="text-xs uppercase tracking-[0.18em] text-neutral-300">Tonight’s pulse</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          {user.displayName ?? user.handle}, your social dashboard is live.
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-neutral-300">
          Keep momentum with fresh posts, tighten your profile voice, and jump into high-signal conversations.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <ButtonLink href="/posts">Open feed</ButtonLink>
          <Link
            href={`/u/${handleSlug(user.handle)}`}
            className="rounded-lg border border-neutral-600 bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-100 hover:bg-neutral-800"
          >
            View public profile
          </Link>
          <ButtonLink href="/profile">Edit profile</ButtonLink>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-wide text-neutral-500">Posts published</p>
          <p className="mt-1 text-2xl font-semibold">{postCount}</p>
          <p className="mt-1 text-xs text-neutral-500">Original updates shared to your network.</p>
        </Card>

        <Card>
          <p className="text-xs uppercase tracking-wide text-neutral-500">Reviews logged</p>
          <p className="mt-1 text-2xl font-semibold">{reviewCount}</p>
          <p className="mt-1 text-xs text-neutral-500">Structured strain notes with ratings and context.</p>
        </Card>

        <Card>
          <p className="text-xs uppercase tracking-wide text-neutral-500">Unread notifications</p>
          <p className="mt-1 text-2xl font-semibold">{unreadCount}</p>
          <p className="mt-1 text-xs text-neutral-500">Replies, favorites, and follow activity waiting on you.</p>
        </Card>
      </div>

      <Card>
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
              <li key={post.id} className="rounded-lg border border-neutral-200 bg-white p-3">
                <Link href={`/posts/${post.id}`} className="text-sm font-medium underline">
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
