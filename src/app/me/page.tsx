import Link from "next/link";

import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { Card, Container, PageHeader } from "@/app/_components/ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Me",
};

export default async function MePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <Container>
        <PageHeader title="Me" subtitle="You are not signed in." />
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

  return (
    <Container>
      <PageHeader title="Me" subtitle="Session info (auth foundation)." />

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
            href="/profile"
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
    </Container>
  );
}
