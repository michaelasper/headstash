"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

import { Card, Field, inputClassName } from "@/app/_components/ui";

export default function SignInForm() {
  const [email, setEmail] = useState("");

  return (
    <Card>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await signIn("email", { email, callbackUrl: "/me" });
        }}
        className="flex flex-col gap-4"
      >
        <Field label="Email">
          <input
            name="email"
            type="email"
            required
            className={inputClassName}
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <button
          type="submit"
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-neutral-200"
        >
          Send magic link
        </button>

        <p className="text-xs text-neutral-500">
          DEV: if SMTP isn’t configured, the magic link is printed to the server console.
        </p>
      </form>
    </Card>
  );
}
