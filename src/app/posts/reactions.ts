"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

const toggleSchema = z.object({
  postId: z.string().trim().cuid(),
});

export async function toggleLike(formData: FormData) {
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

  const existing = await prisma.reaction.findUnique({
    where: {
      postId_userId_kind: {
        postId: parsed.data.postId,
        userId: user.id,
        kind: "LIKE",
      },
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.reaction.create({
      data: {
        postId: parsed.data.postId,
        userId: user.id,
        kind: "LIKE",
      },
    });
  }

  revalidatePath("/posts");
}
