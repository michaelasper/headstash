import Link from "next/link";

import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Container, PageHeader } from "@/app/_components/ui";
import ProfileForm from "@/app/profile/ProfileForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Onboarding",
};

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return (
      <Container>
        <PageHeader title="Onboarding" subtitle="Sign in to continue." />
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

  const linksText =
    Array.isArray(user?.links) && user?.links.every((v) => typeof v === "string")
      ? (user.links as string[]).join("\n")
      : "";

  return (
    <Container>
      <PageHeader
        title="Welcome"
        subtitle="Set your handle and basic profile to get started."
        right={
          <Link href="/me" className="text-sm text-neutral-600 hover:underline">
            Skip
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

      <p className="text-xs text-neutral-500">
        Tip: your public profile URL is based on your handle.
      </p>
    </Container>
  );
}
