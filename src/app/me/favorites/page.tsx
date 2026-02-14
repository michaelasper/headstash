import Link from "next/link";

import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, Container, PageHeader } from "@/app/_components/ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Favorites",
};

export default async function FavoritesPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return (
      <Container>
        <PageHeader title="Favorites" subtitle="Sign in to view your favorites." />
        <Card>
          <Link
            href="/auth/signin"
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-neutral-200"
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
        <PageHeader title="Favorites" subtitle="User not found." />
      </Container>
    );
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 100,
    include: {
      post: {
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
      },
    },
  });

  return (
    <Container>
      <PageHeader
        title="Favorites"
        subtitle="Posts you’ve favorited."
        right={
          <Link href="/me" className="text-sm text-neutral-600 hover:underline">
            Back
          </Link>
        }
      />

      <Card>
        {favorites.length === 0 ? (
          <p className="text-sm text-neutral-600">
            No favorites yet. Tap “Favorite” on a post.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {favorites.map((f) => (
              <li key={f.id} className="py-3">
                <Link
                  href={`/posts/${f.postId}`}
                  className="block rounded-md px-1 py-1 hover:bg-neutral-50"
                >
                  <div className="text-xs text-neutral-500">
                    {f.post.author.handle ??
                      f.post.author.displayName ??
                      f.post.author.email ??
                      "Anonymous"}
                  </div>
                  <div className="line-clamp-2 whitespace-pre-wrap text-sm text-neutral-800">
                    {f.post.body}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Container>
  );
}
