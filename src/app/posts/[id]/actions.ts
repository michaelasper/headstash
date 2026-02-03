"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

const createCommentSchema = z.object({
  postId: z.string().trim().cuid(),
  body: z.string().trim().min(1).max(500),
});

export type CreateCommentState = { error?: string };

export async function createComment(
  _prev: CreateCommentState,
  formData: FormData,
): Promise<CreateCommentState> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return { error: "You must be signed in to comment." };

  const parsed = createCommentSchema.safeParse({
    postId: formData.get("postId"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return { error: "Comment is required (max 500 chars)." };
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });
  if (!user) return { error: "User not found." };

  const comment = await prisma.comment.create({
    data: {
      postId: parsed.data.postId,
      authorId: user.id,
      body: parsed.data.body,
    },
    select: { id: true },
  });

  // Notify post author (avoid self-notify).
  const post = await prisma.post.findUnique({
    where: { id: parsed.data.postId },
    select: { authorId: true },
  });
  if (post && post.authorId !== user.id) {
    await prisma.notification.create({
      data: {
        userId: post.authorId,
        actorUserId: user.id,
        type: "COMMENT_POST",
        postId: parsed.data.postId,
        commentId: comment.id,
      },
    });
  }

  revalidatePath("/posts");
  revalidatePath(`/posts/${parsed.data.postId}`);
  revalidatePath("/notifications");
  redirect(`/posts/${parsed.data.postId}`);
}
