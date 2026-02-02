import Link from "next/link";

import { Card, Container, PageHeader } from "@/app/_components/ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Check your email",
};

export default function VerifyRequestPage() {
  return (
    <Container>
      <PageHeader title="Check your email" subtitle="We sent you a sign-in link." />

      <Card>
        <p className="text-sm text-neutral-700">
          Click the link in your email to finish signing in.
        </p>
        <p className="mt-2 text-xs text-neutral-500">
          DEV: if you don’t have SMTP configured, the link is printed in the dev server console.
        </p>

        <div className="mt-4">
          <Link href="/auth/signin" className="text-sm font-medium hover:underline">
            Back to sign in
          </Link>
        </div>
      </Card>
    </Container>
  );
}
