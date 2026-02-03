import Link from "next/link";

import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handleSlug } from "@/lib/handles";
import { Card, Container, PageHeader } from "@/app/_components/ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Me",
};

export default async function MePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return (
      <Container>
        <PageHeader title="Me" subtitle="You are not signed in." />
        <Card>
          <Link
            href="/auth/signin"
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
          >
            Sign in
          </Link>
        </Card>
      </Container>
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
      <Container>
        <PageHeader title="Welcome" subtitle="Let’s set up your profile." />
        <Card>
          <Link
            href="/onboarding"
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
          >
            Continue onboarding
          </Link>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <PageHeader
        title="Me"
        subtitle={user.displayName ?? user.handle ?? "Session info"}
        right={
          <div className="flex gap-3 text-sm">
            <Link href="/posts" className="text-neutral-600 hover:underline">
              Posts
            </Link>
            <Link href="/me/favorites" className="text-neutral-600 hover:underline">
              Favorites
            </Link>
            <Link
              href="/notifications"
              className="flex items-center gap-1 text-neutral-600 hover:underline"
            >
              <span>Notifications</span>
              {unreadCount > 0 ? (
                <span className="rounded-full bg-neutral-900 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                  {unreadCount}
                </span>
              ) : null}
            </Link>
            <Link href="/search" className="text-neutral-600 hover:underline">
              Search
            </Link>
          </div>
        }
      />

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
            className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
          >
            Edit profile
          </Link>
          <Link
            href={`/u/${handleSlug(user.handle)}`}
            className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
          >
            View public profile
          </Link>
          <Link
            href="/api/auth/signout"
            className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
          >
            Sign out
          </Link>
        </div>
      </Card>
    </Container>
  );
}
