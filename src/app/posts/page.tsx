import Link from "next/link";

import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, Container, PageHeader } from "@/app/_components/ui";
import PostComposer from "@/app/posts/postComposer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Posts",
};

function displayName(u: { displayName: string | null; handle: string | null; email: string | null }) {
  return u.displayName ?? u.handle ?? u.email ?? "Anonymous";
}

export default async function PostsPage() {
  const session = await getServerSession(authOptions);

  const posts = await prisma.post.findMany({
    orderBy: [{ createdAt: "desc" }],
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
    },
  });

  return (
    <Container>
      <PageHeader
        title="Posts"
        subtitle="A simple feed (v0)."
        right={
          <Link href="/" className="text-sm text-neutral-600 hover:underline">
            Home
          </Link>
        }
      />

      <Card>
        {session?.user?.email ? (
          <PostComposer />
        ) : (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-neutral-600">
              Sign in to create posts.
            </p>
            <Link
              href="/auth/signin"
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-neutral-200"
            >
              Sign in
            </Link>
          </div>
        )}
      </Card>

      <Card>
        {posts.length === 0 ? (
          <p className="text-sm text-neutral-600">No posts yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {posts.map((p) => (
              <li key={p.id} className="py-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-full border border-neutral-200 bg-neutral-100">
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
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="truncate text-sm font-medium">
                        {p.author.handle ? (
                          <Link href={`/u/${p.author.handle.replace(/^@/, "")}`} className="hover:underline">
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

                    <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-800">
                      {p.body}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Container>
  );
}
