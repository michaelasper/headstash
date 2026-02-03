import Link from "next/link";
import { notFound } from "next/navigation";

import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, Container, PageHeader } from "@/app/_components/ui";
import CommentForm from "@/app/posts/[id]/CommentForm";
import { toggleFavoritePost } from "@/app/posts/favorites";

function ReviewCard({
  review,
}: {
  review: {
    id: string;
    rating: string;
    consumedAt: Date | null;
    notes: string | null;
    strain: { name: string };
  };
}) {
  return (
    <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
      <div className="text-sm font-medium">
        {review.strain.name} · {review.rating}
      </div>
      <div className="mt-1 text-xs text-neutral-600">
        {review.consumedAt ? review.consumedAt.toLocaleDateString() : "(no date)"}
      </div>
      {review.notes ? (
        <div className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-neutral-700">
          {review.notes}
        </div>
      ) : null}
      <div className="mt-2">
        <Link
          href={`/reviews/${review.id}/edit`}
          className="text-xs font-medium text-neutral-900 underline"
        >
          View review
        </Link>
      </div>
    </div>
  );
}

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

  const viewerEmail = session?.user?.email?.toLowerCase() ?? null;
  const viewer = viewerEmail
    ? await prisma.user.findUnique({ where: { email: viewerEmail }, select: { id: true } })
    : null;

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: {
        select: { displayName: true, handle: true, email: true, avatarUrl: true },
      },
      favorites: viewer ? { where: { userId: viewer.id }, select: { id: true } } : false,
      _count: { select: { reactions: true, comments: true, favorites: true } },
      review: {
        include: { strain: true },
      },
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

            {post.review ? <ReviewCard review={post.review} /> : null}

            <div className="mt-3 flex flex-wrap items-center gap-3">
              {viewer ? (
                <form action={toggleFavoritePost}>
                  <input type="hidden" name="postId" value={post.id} />
                  <button
                    type="submit"
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2 ${
                      post.favorites && post.favorites.length > 0
                        ? "bg-neutral-900 text-white"
                        : "border border-neutral-200 bg-white hover:bg-neutral-50"
                    }`}
                  >
                    {post.favorites && post.favorites.length > 0
                      ? "Favorited"
                      : "Favorite"}
                  </button>
                </form>
              ) : (
                <Link
                  href="/auth/signin"
                  className="text-sm font-medium text-neutral-900 underline"
                >
                  Sign in to favorite
                </Link>
              )}

              <div className="text-xs text-neutral-500">
                {post._count.reactions} like{post._count.reactions === 1 ? "" : "s"} · {" "}
                {post._count.comments} comment{post._count.comments === 1 ? "" : "s"} · {" "}
                {post._count.favorites} favorite{post._count.favorites === 1 ? "" : "s"}
              </div>
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
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
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
