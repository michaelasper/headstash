import Link from "next/link";

import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handleSlug } from "@/lib/handles";
import { AppShell, AppShellNavLink, Card } from "@/app/_components/ui";

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
          <Link
            href="/auth/signin"
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-neutral-200"
          >
            Sign in
          </Link>
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
          <Link
            href="/onboarding"
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-neutral-200"
          >
            Continue onboarding
          </Link>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Account"
      subtitle={user.displayName ?? user.handle ?? "Session info"}
      nav={
        <>
          <AppShellNavLink href="/posts">Posts</AppShellNavLink>
          <AppShellNavLink href="/me/favorites">Favorites</AppShellNavLink>
          <AppShellNavLink href="/notifications">
            Notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}
          </AppShellNavLink>
          <AppShellNavLink href="/search">Search</AppShellNavLink>
        </>
      }
    >
      <Card>
        <div className="text-sm">
          <div>
            <span className="text-neutral-500">Email:</span>{" "}
            <span className="font-medium">{session.user.email ?? "—"}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/profile"
            className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-neutral-200"
          >
            Edit profile
          </Link>
          <Link
            href={`/u/${handleSlug(user.handle)}`}
            className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-neutral-200"
          >
            View public profile
          </Link>
          <Link
            href="/api/auth/signout"
            className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-neutral-200"
          >
            Sign out
          </Link>
        </div>
      </Card>
    </AppShell>
  );
}
