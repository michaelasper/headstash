"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getServerSession } from "next-auth";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/auth";

const handleSchema = z
  .string()
  .trim()
  .transform((v) => v.toLowerCase())
  .refine((v) => v.startsWith("@"), { message: "Handle must start with @" })
  .refine((v) => /^@[a-z0-9_]+$/.test(v), {
    message: "Handle can contain only letters, numbers, and underscores",
  })
  .refine((v) => v.length >= 3 && v.length <= 20, {
    message: "Handle must be 3–20 characters (including @)",
  });

const urlSchema = z
  .string()
  .trim()
  .url()
  .refine((u) => u.startsWith("http://") || u.startsWith("https://"), {
    message: "Links must start with http(s)://",
  });

const updateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  handle: handleSchema.optional().transform((v) => (v ? v : undefined)),
  bio: z
    .string()
    .trim()
    .max(280)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  avatarUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  links: z
    .string()
    .optional()
    .transform((v) => (v ?? ""))
    .transform((raw) =>
      raw
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    )
    .refine((arr) => arr.length <= 5, { message: "Up to 5 links max" })
    .refine((arr) => arr.every((u) => urlSchema.safeParse(u).success), {
      message: "Each link must be a valid http(s) URL",
    })
    .transform((arr) => (arr.length > 0 ? arr : undefined)),
});

export type UpdateProfileState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function updateProfile(
  _prevState: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { error: "You must be signed in." };
  }

  const parsed = updateProfileSchema.safeParse({
    displayName: formData.get("displayName"),
    handle: formData.get("handle"),
    bio: formData.get("bio"),
    avatarUrl: formData.get("avatarUrl"),
    links: formData.get("links"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] = issue.message;
    }
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }

  const email = session.user.email.toLowerCase();

  try {
    await prisma.user.update({
      where: { email },
      data: {
        displayName: parsed.data.displayName,
        handle: parsed.data.handle,
        bio: parsed.data.bio,
        avatarUrl: parsed.data.avatarUrl,
        links: parsed.data.links,
      },
    });
  } catch (e: unknown) {
    // Prisma unique constraint (handle) failure typically surfaces here.
    const msg = String((e as { message?: string } | null)?.message ?? "");
    if (msg.includes("Unique constraint") || msg.includes("UNIQUE") || msg.includes("handle")) {
      return {
        error: "That handle is already taken.",
        fieldErrors: { handle: "Handle is already taken" },
      };
    }
    return { error: "Failed to update profile." };
  }

  revalidatePath("/profile");
  redirect("/profile");
}
