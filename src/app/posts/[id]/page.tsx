import Link from "next/link";
import { notFound } from "next/navigation";

import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, Container, PageHeader, buttonClassName } from "@/app/_components/ui";
import CommentForm from "@/app/posts/[id]/CommentForm";
import { toggleFavoritePost } from "@/app/posts/favorites";
import { SocialProfileInline } from "@/app/_components/socialProfileCard";

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
        <Link href={`/reviews/${review.id}/edit`} className="text-xs font-medium text-neutral-900 underline">
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
            select: { id: true, displayName: true, handle: true, email: true, avatarUrl: true },
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
        <div className="flex flex-col gap-2">
          <SocialProfileInline
            author={post.author}
            timestamp={post.createdAt.toLocaleString()}
            meta={
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide">
                member
              </span>
            }
          />

          <p className="pl-[52px] whitespace-pre-wrap text-sm text-neutral-800">{post.body}</p>

          {post.review ? <ReviewCard review={post.review} /> : null}

          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-2">
            {viewer ? (
              <form action={toggleFavoritePost}>
                <input type="hidden" name="postId" value={post.id} />
                <button
                  type="submit"
                  aria-pressed={Boolean(post.favorites && post.favorites.length > 0)}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    post.favorites && post.favorites.length > 0
                      ? "border-neutral-900 bg-neutral-900 text-white shadow-sm"
                      : "border-neutral-300 bg-white text-neutral-600 hover:border-neutral-900 hover:text-neutral-900"
                  }`}
                >
                  <span aria-hidden="true">{post.favorites && post.favorites.length > 0 ? "★" : "☆"}</span>
                  {post.favorites && post.favorites.length > 0 ? "Favorited" : "Favorite"}
                </button>
              </form>
            ) : (
              <Link
                href="/auth/signin"
                className="inline-flex items-center rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 hover:border-neutral-900 hover:text-neutral-900"
              >
                Sign in to favorite
              </Link>
            )}

            <Link
              href="#comments"
              className="inline-flex items-center rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 hover:border-neutral-900 hover:text-neutral-900"
            >
              💬 Jump to comments ({post._count.comments})
            </Link>

            <div className="ml-auto text-xs text-neutral-500">
              {post._count.reactions} like{post._count.reactions === 1 ? "" : "s"} · {" "}
              {post._count.comments} comment{post._count.comments === 1 ? "" : "s"} · {" "}
              {post._count.favorites} favorite{post._count.favorites === 1 ? "" : "s"}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div id="comment-compose">
          {session?.user?.email ? (
            <CommentForm postId={post.id} />
          ) : (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-neutral-600">Sign in to comment.</p>
              <Link href="/auth/signin" className={buttonClassName("primary")}>
                Sign in
              </Link>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <h2 id="comments" className="text-sm font-medium">Conversation</h2>
          <Link href="#comment-compose" className="text-xs text-neutral-600 underline">
            Add reply
          </Link>
        </div>
        {post.comments.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-600">No comments yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {post.comments.map((c, index) => {
              const isViewerComment = Boolean(viewer && c.author.id === viewer.id);
              const previous = index > 0 ? post.comments[index - 1] : null;
              const isContinuation = Boolean(previous && previous.author.id === c.author.id);

              return (
                <li key={c.id} className={`flex ${isViewerComment ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`w-full max-w-[92%] rounded-2xl border p-3 ${
                      isViewerComment
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-200 bg-white text-neutral-900"
                    }`}
                  >
                    {!isContinuation ? (
                      <div
                        className={`flex items-center gap-2 text-xs ${
                          isViewerComment ? "text-neutral-300" : "text-neutral-500"
                        }`}
                      >
                        <span className="font-medium">
                          {c.author.handle ? `@${c.author.handle.replace(/^@/, "")}` : c.author.displayName ?? "Member"}
                        </span>
                        <span>•</span>
                        <span>{c.createdAt.toLocaleString()}</span>
                      </div>
                    ) : (
                      <div className={`text-[11px] ${isViewerComment ? "text-neutral-400" : "text-neutral-500"}`}>
                        {c.createdAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </div>
                    )}

                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{c.body}</p>

                    <div
                      className={`mt-2 flex items-center gap-3 text-[11px] uppercase tracking-wide ${
                        isViewerComment ? "text-neutral-300" : "text-neutral-500"
                      }`}
                    >
                      <span>{isViewerComment ? "you" : "member"}</span>
                      <Link href="#comment-compose" className="underline">
                        reply
                      </Link>
                    </div>
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
