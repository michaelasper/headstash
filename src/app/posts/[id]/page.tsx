import Link from "next/link";
import { notFound } from "next/navigation";

import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, Container, PageHeader } from "@/app/_components/ui";
import CommentForm from "@/app/posts/[id]/CommentForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Post",
};

function displayName(u: {
  displayName: string | null;
  handle: string | null;
  email: string | null;
}) {
  return u.displayName ?? u.handle ?? u.email ?? "Anonymous";
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getServerSession(authOptions);

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: {
        select: { displayName: true, handle: true, email: true, avatarUrl: true },
      },
      _count: { select: { reactions: true, comments: true } },
      comments: {
        orderBy: [{ createdAt: "asc" }],
        include: {
          author: {
            select: { displayName: true, handle: true, email: true, avatarUrl: true },
          },
        },
      },
    },
  });

  if (!post) notFound();

  return (
    <Container>
      <PageHeader
        title="Post"
        subtitle=""
        right={
          <Link href="/posts" className="text-sm text-neutral-600 hover:underline">
            Back
          </Link>
        }
      />

      <Card>
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-full border border-neutral-200 bg-neutral-100">
            {post.author.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.author.avatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <div className="truncate text-sm font-medium">
                {post.author.handle ? (
                  <Link
                    href={`/u/${post.author.handle.replace(/^@/, "")}`}
                    className="hover:underline"
                  >
                    {displayName(post.author)}
                  </Link>
                ) : (
                  displayName(post.author)
                )}
              </div>
              <div className="shrink-0 text-xs text-neutral-500">
                {post.createdAt.toLocaleString()}
              </div>
            </div>

            <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-800">
              {post.body}
            </p>

            <div className="mt-3 text-xs text-neutral-500">
              {post._count.reactions} like{post._count.reactions === 1 ? "" : "s"} · {" "}
              {post._count.comments} comment{post._count.comments === 1 ? "" : "s"}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        {session?.user?.email ? (
          <CommentForm postId={post.id} />
        ) : (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-neutral-600">Sign in to comment.</p>
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
        <h2 className="text-sm font-medium">Comments</h2>
        {post.comments.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-600">No comments yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200">
            {post.comments.map((c) => (
              <li key={c.id} className="py-3">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 overflow-hidden rounded-full border border-neutral-200 bg-neutral-100">
                    {c.author.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.author.avatarUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="truncate text-sm font-medium">
                        {c.author.handle ? (
                          <Link
                            href={`/u/${c.author.handle.replace(/^@/, "")}`}
                            className="hover:underline"
                          >
                            {displayName(c.author)}
                          </Link>
                        ) : (
                          displayName(c.author)
                        )}
                      </div>
                      <div className="shrink-0 text-xs text-neutral-500">
                        {c.createdAt.toLocaleString()}
                      </div>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-800">
                      {c.body}
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
