"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

function normalizeHandle(raw: string) {
  const h = raw.trim().toLowerCase();
  return h.startsWith("@") ? h : `@${h}`;
}

const followSchema = z.object({
  handle: z.string().min(1).max(50),
});

export async function followUser(formData: FormData) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) throw new Error("Unauthorized");

  const parsed = followSchema.safeParse({ handle: formData.get("handle") });
  if (!parsed.success) throw new Error("Invalid request");

  const targetHandle = normalizeHandle(parsed.data.handle);

  const [me, target] = await Promise.all([
    prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, handle: true },
    }),
    prisma.user.findUnique({
      where: { handle: targetHandle },
      select: { id: true, handle: true },
    }),
  ]);

  if (!me) throw new Error("User not found");
  if (!target) throw new Error("Target not found");
  if (me.id === target.id) throw new Error("Cannot follow yourself");

  const where = { followerId_followingId: { followerId: me.id, followingId: target.id } };

  // Only notify on a *new* follow.
  const existing = await prisma.follow.findUnique({
    where,
    select: { followerId: true },
  });

  if (!existing) {
    await prisma.follow.create({
      data: { followerId: me.id, followingId: target.id },
    });

    // Notify the followed user (avoid self-notify).
    if (me.id !== target.id) {
      await prisma.notification.create({
        data: {
          userId: target.id,
          actorUserId: me.id,
          type: "FOLLOW",
        },
      });
    }
  }

  revalidatePath(`/u/${targetHandle.replace(/^@/, "")}`);
}

export async function unfollowUser(formData: FormData) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) throw new Error("Unauthorized");

  const parsed = followSchema.safeParse({ handle: formData.get("handle") });
  if (!parsed.success) throw new Error("Invalid request");

  const targetHandle = normalizeHandle(parsed.data.handle);

  const [me, target] = await Promise.all([
    prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    }),
    prisma.user.findUnique({
      where: { handle: targetHandle },
      select: { id: true },
    }),
  ]);

  if (!me || !target) return;

  await prisma.follow.deleteMany({
    where: { followerId: me.id, followingId: target.id },
  });

  revalidatePath(`/u/${targetHandle.replace(/^@/, "")}`);
}
