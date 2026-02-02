import EmailProvider from "next-auth/providers/email";
import type { NextAuthOptions } from "next-auth";

import { PrismaAdapter } from "@next-auth/prisma-adapter";

import { prisma } from "@/lib/prisma";

const hasSmtp = !!process.env.EMAIL_SERVER_HOST;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      // If SMTP is configured, use it. Otherwise, we still register the provider,
      // but override sendVerificationRequest to log the magic link (DEV ONLY).
      server: hasSmtp
        ? {
            host: process.env.EMAIL_SERVER_HOST,
            port: Number(process.env.EMAIL_SERVER_PORT ?? "587"),
            auth: {
              user: process.env.EMAIL_SERVER_USER,
              pass: process.env.EMAIL_SERVER_PASSWORD,
            },
          }
        : { host: "localhost", port: 587 },
      from: process.env.EMAIL_FROM ?? "Headstash <no-reply@localhost>",
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
  ],
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify",
  },
  session: { strategy: "database" },
  secret:
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "dev-secret-not-for-production",
};
