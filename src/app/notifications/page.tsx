import Link from "next/link";

import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, Container, PageHeader } from "@/app/_components/ui";
import { markAllNotificationsRead, markNotificationRead } from "@/app/notifications/actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Notifications",
};

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ marked?: string }>;
}) {
  const { marked } = await searchParams;
  const justMarkedAll = marked === "1";

  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return (
      <Container>
        <PageHeader title="Notifications" subtitle="Sign in to view notifications." />
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

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });

  if (!user) {
    return (
      <Container>
        <PageHeader title="Notifications" subtitle="User not found." />
      </Container>
    );
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: [{ createdAt: "desc" }],
    take: 50,
    include: {
      actorUser: { select: { handle: true, displayName: true, email: true } },
    },
  });

  const unread = notifications.filter((n) => !n.readAt).length;

  return (
    <Container>
      <PageHeader
        title="Notifications"
        subtitle={unread > 0 ? `${unread} unread` : "All caught up"}
        right={
          <Link href="/me" className="text-sm text-neutral-600 hover:underline">
            Back
          </Link>
        }
      />

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-neutral-600">Recent activity</div>
          <form action={markAllNotificationsRead}>
            <button
              type="submit"
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
            >
              Mark all read
            </button>
          </form>
        </div>
        {justMarkedAll ? (
          <p className="mt-3 text-sm text-neutral-600">Marked all as read.</p>
        ) : null}
      </Card>

      <Card>
        {notifications.length === 0 ? (
          <p className="text-sm text-neutral-600">No notifications yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {notifications.map((n) => {
              const actor =
                n.actorUser.handle ?? n.actorUser.displayName ?? n.actorUser.email ?? "Someone";

              const targetLink = n.postId ? `/posts/${n.postId}` : n.actorUser.handle ? `/u/${n.actorUser.handle.replace(/^@/, "")}` : null;

              const label =
                n.type === "FOLLOW"
                  ? `${actor} followed you`
                  : n.type === "LIKE_POST"
                    ? `${actor} liked your post`
                    : `${actor} commented on your post`;

              return (
                <li key={n.id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {targetLink ? (
                        <Link href={targetLink} className="text-sm font-medium hover:underline">
                          {label}
                        </Link>
                      ) : (
                        <div className="text-sm font-medium">{label}</div>
                      )}
                      <div className="mt-1 text-xs text-neutral-500">
                        {n.createdAt.toLocaleString()}
                      </div>
                    </div>
                    {!n.readAt ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-2 w-2 rounded-full bg-neutral-900" />
                        <form action={markNotificationRead}>
                          <input
                            type="hidden"
                            name="notificationId"
                            value={n.id}
                          />
                          <button
                            type="submit"
                            className="text-xs font-medium text-neutral-900 underline"
                          >
                            Mark read
                          </button>
                        </form>
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </Container>
  );
}
