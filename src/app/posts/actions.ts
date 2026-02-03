"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

const createPostSchema = z.object({
  body: z.string().trim().min(1).max(1000),
  reviewId: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined))
    .refine((v) => v === undefined || z.string().cuid().safeParse(v).success, {
      message: "reviewId must be a cuid",
    }),
});

export type CreatePostState = { error?: string };

export async function createPost(
  _prev: CreatePostState,
  formData: FormData,
): Promise<CreatePostState> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return { error: "You must be signed in to post." };

  const parsed = createPostSchema.safeParse({
    body: formData.get("body"),
    reviewId: formData.get("reviewId"),
  });

  if (!parsed.success) return { error: "Post body is required (max 1000 chars)." };

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });
  if (!user) return { error: "User not found." };

  const reviewId: string | undefined = parsed.data.reviewId;

  if (reviewId) {
    const owned = await prisma.review.findFirst({
      where: { id: reviewId, userId: user.id },
      select: { id: true },
    });
    if (!owned) return { error: "Invalid review selection." };
  }

  await prisma.post.create({
    data: {
      authorId: user.id,
      body: parsed.data.body,
      reviewId,
    },
  });

  revalidatePath("/posts");
  redirect("/posts");
}
