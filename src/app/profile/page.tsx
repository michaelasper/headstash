import Link from "next/link";

import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, Container, PageHeader } from "@/app/_components/ui";
import ProfileForm from "@/app/profile/ProfileForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return (
      <Container>
        <PageHeader title="Profile" subtitle="You must be signed in." />
        <Link
          href="/auth/signin"
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-neutral-200"
        >
          Sign in
        </Link>
      </Container>
    );
  }

  const email = session.user.email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      displayName: true,
      handle: true,
      bio: true,
      avatarUrl: true,
      links: true,
    },
  });

  const recentPosts = await prisma.post.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 80,
    include: {
      author: {
        select: {
          displayName: true,
          handle: true,
          email: true,
        },
      },
      review: {
        include: {
          strain: true,
        },
      },
      _count: {
        select: {
          comments: true,
        },
      },
    },
  });

  const creatorsToWatch = Array.from(
    recentPosts
      .reduce((acc, post) => {
        const authorEmail = post.author.email?.toLowerCase() ?? null;
        if (!authorEmail || authorEmail === email) {
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
    recentPosts
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

  const conversationsToJoin = [...recentPosts]
    .filter((post) => post._count.comments > 0)
    .sort((a, b) => {
      if (b._count.comments !== a._count.comments) {
        return b._count.comments - a._count.comments;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    })
    .slice(0, 3);

  const linksText =
    Array.isArray(user?.links) && user?.links.every((v) => typeof v === "string")
      ? (user.links as string[]).join("\n")
      : "";

  return (
    <Container>
      <PageHeader
        title="Profile"
        subtitle="Update the details people see on your public profile."
        right={
          <Link href="/me" className="text-sm text-neutral-600 hover:underline">
            Back
          </Link>
        }
      />

      <ProfileForm
        initial={{
          displayName: user?.displayName ?? "",
          handle: user?.handle ?? "",
          bio: user?.bio ?? "",
          avatarUrl: user?.avatarUrl ?? "",
          linksText,
        }}
      />

      <Card>
        <h2 className="text-sm font-medium">Discover from your profile</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Creators to watch</h3>
            {creatorsToWatch.length === 0 ? (
              <p className="text-sm text-neutral-600">Creator recommendations will populate as more posts appear.</p>
            ) : (
              <ul className="space-y-1.5">
                {creatorsToWatch.map((creator) => (
                  <li key={creator.email} className="text-sm text-neutral-900">
                    {creator.handle ? (
                      <Link href={`/u/${creator.handle.replace(/^@/, "")}`} className="font-medium underline">
                        @{creator.handle.replace(/^@/, "")}
                      </Link>
                    ) : (
                      <span className="font-medium">{creator.displayName ?? "Member"}</span>
                    )}
                    <span className="ml-2 text-xs text-neutral-500">
                      {creator.postCount} recent post{creator.postCount === 1 ? "" : "s"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Trending strains</h3>
            {trendingStrains.length === 0 ? (
              <p className="text-sm text-neutral-600">Trending strains will appear when review posts are available.</p>
            ) : (
              <ul className="space-y-1.5">
                {trendingStrains.map(([strainName, count]) => (
                  <li key={strainName} className="text-sm text-neutral-900">
                    <span className="font-medium">{strainName}</span>
                    <span className="ml-2 text-xs text-neutral-500">
                      {count} mention{count === 1 ? "" : "s"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Conversations to join</h3>
            {conversationsToJoin.length === 0 ? (
              <p className="text-sm text-neutral-600">No active discussions yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {conversationsToJoin.map((post) => (
                  <li key={post.id} className="text-sm text-neutral-900">
                    <Link href={`/posts/${post.id}`} className="font-medium underline">
                      {post.author.handle ? `@${post.author.handle.replace(/^@/, "")}` : post.author.displayName ?? "Member"}
                    </Link>
                    <span className="ml-2 text-xs text-neutral-500">
                      {post._count.comments} comment{post._count.comments === 1 ? "" : "s"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </Card>

      {user?.handle ? (
        <p className="text-xs text-neutral-500">
          Public profile: {" "}
          <Link
            href={`/u/${user.handle.replace(/^@/, "")}`}
            className="underline"
          >
            /u/{user.handle}
          </Link>
        </p>
      ) : (
        <p className="text-xs text-neutral-500">
          Set a handle to enable your public profile URL.
        </p>
      )}
    </Container>
  );
}
