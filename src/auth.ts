import EmailProvider from "next-auth/providers/email";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";

import bcrypt from "bcryptjs";
import { z } from "zod";

import { PrismaAdapter } from "@next-auth/prisma-adapter";

import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/auth/rateLimit";
import {
  authLocalMode,
  env,
  isCredentialsOnlyMode,
  isGithubConfigured,
  isSmtpConfigured,
  resolvedAuthSecret,
} from "@/lib/env";

const hasSmtp = isSmtpConfigured;
const localCredentialsOnly = isCredentialsOnlyMode;

const githubEnabled = !localCredentialsOnly && isGithubConfigured;

const emailMagicEnabled = !localCredentialsOnly;

export const authRuntimeConfig = {
  localMode: authLocalMode,
  credentialsOnly: localCredentialsOnly,
  githubEnabled,
  emailMagicEnabled,
  hasSmtp,
};

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    ...(githubEnabled
      ? [
          GitHubProvider({
            clientId: env.GITHUB_CLIENT_ID!,
            clientSecret: env.GITHUB_CLIENT_SECRET!,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = z
          .object({
            email: z.string().trim().email().max(320),
            password: z.string().min(8).max(200),
          })
          .safeParse(credentials);

        if (!parsed.success) return null;

        const key = `login:${parsed.data.email.toLowerCase()}`;
        const rl = checkRateLimit(key, { windowMs: 60_000, max: 8 });
        if (!rl.ok) {
          // Don't leak account existence; just fail.
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
          include: { credential: true },
        });

        if (!user?.credential?.passwordHash) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.credential.passwordHash);
        if (!ok) return null;

        return { id: user.id, email: user.email };
      },
    }),
    ...(emailMagicEnabled
      ? [
          EmailProvider({
            // If SMTP is configured, use it. Otherwise, we still register the provider,
            // but override sendVerificationRequest to log the magic link (DEV ONLY).
            server: hasSmtp
              ? {
                  host: env.EMAIL_SERVER_HOST,
                  port: env.EMAIL_SERVER_PORT ?? 587,
                  auth: {
                    user: env.EMAIL_SERVER_USER,
                    pass: env.EMAIL_SERVER_PASSWORD,
                  },
                }
              : { host: "localhost", port: 587 },
            from: env.EMAIL_FROM ?? "Headstash <no-reply@localhost>",
            async sendVerificationRequest({ identifier, url }) {
              if (hasSmtp) {
                // Let the default implementation send via nodemailer.
                // (EmailProvider uses the provided server/from settings.)
                return;
              }
              // DEV ONLY: log the magic link to server console.
              console.log("\n[DEV] Magic link for", identifier, "→", url, "\n");
            },
          }),
        ]
      : []),
  ],
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify",
  },
  session: { strategy: "database" },
  callbacks: {
    async session({ session, user }) {
      if (session.user && user?.id) {
        // @ts-expect-error augmenting default session user
        session.user.id = user.id;
      }
      return session;
    },
  },
  secret: resolvedAuthSecret,
};
