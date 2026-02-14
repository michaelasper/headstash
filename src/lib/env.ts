import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    DATABASE_URL: z.string().trim().min(1, "DATABASE_URL is required"),

    AUTH_SECRET: z.string().trim().optional(),
    NEXTAUTH_SECRET: z.string().trim().optional(),
    AUTH_URL: z.string().trim().url().optional(),
    NEXTAUTH_URL: z.string().trim().url().optional(),

    AUTH_LOCAL_MODE: z.enum(["full", "credentials-only"]).default("full"),

    GITHUB_CLIENT_ID: z.string().trim().optional(),
    GITHUB_CLIENT_SECRET: z.string().trim().optional(),

    EMAIL_SERVER_HOST: z.string().trim().optional(),
    EMAIL_SERVER_PORT: z.coerce.number().int().positive().optional(),
    EMAIL_SERVER_USER: z.string().trim().optional(),
    EMAIL_SERVER_PASSWORD: z.string().trim().optional(),
    EMAIL_FROM: z.string().trim().optional(),

    PRISMA_SLOW_QUERY_THRESHOLD_MS: z.coerce
      .number()
      .int()
      .nonnegative()
      .default(100),
  })
  .superRefine((value, ctx) => {
    const authSecret = value.AUTH_SECRET ?? value.NEXTAUTH_SECRET;
    const authUrl = value.AUTH_URL ?? value.NEXTAUTH_URL;

    if (value.NODE_ENV === "production") {
      if (!authSecret) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["AUTH_SECRET"],
          message:
            "AUTH_SECRET (or NEXTAUTH_SECRET) is required in production.",
        });
      }

      if (!authUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["AUTH_URL"],
          message: "AUTH_URL (or NEXTAUTH_URL) is required in production.",
        });
      }
    }

    const githubConfigured = !!value.GITHUB_CLIENT_ID || !!value.GITHUB_CLIENT_SECRET;
    if (githubConfigured && (!value.GITHUB_CLIENT_ID || !value.GITHUB_CLIENT_SECRET)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["GITHUB_CLIENT_ID"],
        message:
          "Set both GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET, or leave both unset.",
      });
    }

    const smtpFields = [
      value.EMAIL_SERVER_HOST,
      value.EMAIL_SERVER_PORT,
      value.EMAIL_SERVER_USER,
      value.EMAIL_SERVER_PASSWORD,
      value.EMAIL_FROM,
    ];

    const smtpAny = smtpFields.some(Boolean);
    const smtpAll = smtpFields.every(Boolean);

    if (smtpAny && !smtpAll) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["EMAIL_SERVER_HOST"],
        message:
          "If SMTP is configured, set EMAIL_SERVER_HOST/PORT/USER/PASSWORD/FROM together.",
      });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
    .join("\n");

  throw new Error(`Invalid environment configuration:\n${details}`);
}

export const env = parsed.data;

export const resolvedAuthSecret =
  env.AUTH_SECRET ?? env.NEXTAUTH_SECRET ?? "dev-secret-not-for-production";

export const resolvedAuthUrl = env.AUTH_URL ?? env.NEXTAUTH_URL ?? "http://localhost:3000";

export const authLocalMode = env.AUTH_LOCAL_MODE;
export const isCredentialsOnlyMode = authLocalMode === "credentials-only";

export const isGithubConfigured = !!env.GITHUB_CLIENT_ID && !!env.GITHUB_CLIENT_SECRET;

export const isSmtpConfigured =
  !!env.EMAIL_SERVER_HOST &&
  !!env.EMAIL_SERVER_PORT &&
  !!env.EMAIL_SERVER_USER &&
  !!env.EMAIL_SERVER_PASSWORD &&
  !!env.EMAIL_FROM;
