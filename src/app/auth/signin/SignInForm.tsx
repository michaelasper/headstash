"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

import { Card, Field, inputClassName } from "@/app/_components/ui";

export default function SignInForm() {
  const [email, setEmail] = useState("");

  return (
    <Card>
      <div className="flex flex-col gap-4">
        <div>
          <button
            type="button"
            onClick={async () => {
              await signIn("github", { callbackUrl: "/me" });
            }}
            className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-neutral-200"
          >
            Sign in with GitHub
          </button>
          <p className="mt-2 text-xs text-neutral-500">
            If GitHub OAuth isn’t configured, this button will error.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-neutral-200" />
          <div className="text-xs text-neutral-500">or</div>
          <div className="h-px flex-1 bg-neutral-200" />
        </div>

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
      </div>
    </Card>
  );
}
