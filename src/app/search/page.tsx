import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { Container, PageHeader, Card, inputClassName } from "@/app/_components/ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Search",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();

  const users = query.length >= 2
    ? await prisma.user.findMany({
        where: {
          OR: [
            { handle: { contains: query.toLowerCase() } },
            { displayName: { contains: query } },
          ],
        },
        take: 20,
        select: { displayName: true, handle: true, avatarUrl: true },
      })
    : [];

  const posts = query.length >= 2
    ? await prisma.post.findMany({
        where: {
          OR: [
            { body: { contains: query } },
            { author: { handle: { contains: query.toLowerCase() } } },
          ],
        },
        take: 20,
        orderBy: [{ createdAt: "desc" }],
        include: {
          author: { select: { displayName: true, handle: true, avatarUrl: true, email: true } },
        },
      })
    : [];

  return (
    <Container>
      <PageHeader
        title="Search"
        subtitle="Users and posts (v0)."
        right={
          <Link href="/" className="text-sm text-neutral-600 hover:underline">
            Home
          </Link>
        }
      />

      <Card>
        <form method="get" className="flex gap-2">
          <input
            name="q"
            className={inputClassName}
            placeholder="Search users or posts…"
            defaultValue={query}
            inputMode="search"
          />
          <button
            type="submit"
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
          >
            Search
          </button>
        </form>
        <p className="mt-2 text-xs text-neutral-500">Enter at least 2 characters.</p>
      </Card>

      <Card>
        <h2 className="text-sm font-medium">Users</h2>
        {query.length < 2 ? (
          <p className="mt-2 text-sm text-neutral-600">Type more to search.</p>
        ) : users.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-600">No users found.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200">
            {users.map((u) => (
              <li key={u.handle ?? u.displayName ?? "user"} className="py-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-full border border-neutral-200 bg-neutral-100">
                    {u.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={u.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {u.displayName ?? u.handle ?? "User"}
                    </div>
                    {u.handle ? (
                      <Link
                        href={`/u/${u.handle.replace(/^@/, "")}`}
                        className="text-xs text-neutral-600 hover:underline"
                      >
                        {u.handle}
                      </Link>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="text-sm font-medium">Posts</h2>
        {query.length < 2 ? (
          <p className="mt-2 text-sm text-neutral-600">Type more to search.</p>
        ) : posts.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-600">No posts found.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200">
            {posts.map((p) => (
              <li key={p.id} className="py-3">
                <Link href={`/posts/${p.id}`} className="block hover:bg-neutral-50 rounded-md px-1 py-1">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 overflow-hidden rounded-full border border-neutral-200 bg-neutral-100">
                      {p.author.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.author.avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs text-neutral-600">
                        {p.author.handle ?? p.author.displayName ?? p.author.email ?? "Anonymous"}
                      </div>
                      <div className="line-clamp-2 whitespace-pre-wrap text-sm text-neutral-800">
                        {p.body}
                      </div>
                    </div>
                    <div className="shrink-0 text-xs text-neutral-500">
                      {p.createdAt.toLocaleDateString()}
                    </div>
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
