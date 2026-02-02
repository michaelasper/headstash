import Link from "next/link";

import { Container, PageHeader } from "@/app/_components/ui";
import SignInForm from "@/app/auth/signin/SignInForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sign in",
};

export default function SignInPage() {
  return (
    <Container>
      <PageHeader
        title="Sign in"
        subtitle="Magic link, GitHub OAuth, or email+password."
        right={
          <Link href="/" className="text-sm text-neutral-600 hover:underline">
            Home
          </Link>
        }
      />

      <SignInForm />
    </Container>
  );
}
