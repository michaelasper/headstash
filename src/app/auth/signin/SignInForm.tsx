"use client";

import { useMemo, useState } from "react";
import { signIn } from "next-auth/react";

import { Card, Field, inputClassName } from "@/app/_components/ui";

type Mode = "login" | "signup";

function normalizeEmail(e: string) {
  return e.trim().toLowerCase();
}

export default function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("login");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const emailNormalized = useMemo(() => normalizeEmail(email), [email]);

  return (
    <Card>
      <div className="flex flex-col gap-5">
        <div>
          <button
            type="button"
            onClick={async () => {
              setMessage(null);
              await signIn("github", { callbackUrl: "/me" });
            }}
            className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-neutral-200"
          >
            Sign in with GitHub
          </button>
          <p className="mt-2 text-xs text-neutral-500">
            If GitHub OAuth isn’t configured, this will error.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-neutral-200" />
          <div className="text-xs text-neutral-500">or</div>
          <div className="h-px flex-1 bg-neutral-200" />
        </div>

        <div>
          <div className="mb-2 flex gap-2 text-sm">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setMessage(null);
              }}
              className={`rounded-lg px-3 py-2 font-medium ${
                mode === "login" ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700"
              }`}
            >
              Email + password
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setMessage(null);
              }}
              className={`rounded-lg px-3 py-2 font-medium ${
                mode === "signup" ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700"
              }`}
            >
              Create account
            </button>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setMessage(null);
              try {
                if (mode === "signup") {
                  const res = await fetch("/api/auth/credentials/signup", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ email: emailNormalized, password }),
                  });
                  // Do not reveal whether user existed.
                  if (!res.ok && res.status !== 200) {
                    setMessage("Could not create account. Please try again.");
                    return;
                  }
                }

                await signIn("credentials", {
                  email: emailNormalized,
                  password,
                  callbackUrl: "/me",
                  redirect: true,
                });
              } finally {
                setBusy(false);
              }
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

            <Field
              label="Password"
              hint={mode === "signup" ? "Min 8 characters" : undefined}
            >
              <input
                name="password"
                type="password"
                required
                className={inputClassName}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>

            {message ? <p className="text-sm text-red-600">{message}</p> : null}

            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-neutral-200"
            >
              {mode === "signup" ? "Create account" : "Sign in"}
            </button>

            <p className="text-xs text-neutral-500">
              Note: rate limiting is in-memory (dev-only) and will reset on server restart.
            </p>
          </form>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-neutral-200" />
          <div className="text-xs text-neutral-500">or</div>
          <div className="h-px flex-1 bg-neutral-200" />
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await signIn("email", { email: emailNormalized, callbackUrl: "/me" });
          }}
          className="flex flex-col gap-4"
        >
          <Field label="Email magic link">
            <input
              name="emailMagic"
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
            className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-neutral-200"
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
