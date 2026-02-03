"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

const toggleSchema = z.object({
  postId: z.string().trim().cuid(),
});

export async function toggleFavoritePost(formData: FormData) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) throw new Error("Unauthorized");

  const parsed = toggleSchema.safeParse({ postId: formData.get("postId") });
  if (!parsed.success) throw new Error("Invalid request");

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });
  if (!user) throw new Error("User not found");

  const existing = await prisma.favorite.findUnique({
    where: { userId_postId: { userId: user.id, postId: parsed.data.postId } },
    select: { id: true },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
  } else {
    await prisma.favorite.create({
      data: { userId: user.id, postId: parsed.data.postId },
    });
  }

  revalidatePath("/posts");
  revalidatePath(`/posts/${parsed.data.postId}`);
  revalidatePath("/me/favorites");
}
