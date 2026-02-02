"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { ReviewRating, StrainType } from "@prisma/client";

async function getOrCreateLocalUserId() {
  // No auth yet; use a stable local user so we can create reviews.
  const email = "local@headstash";
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, displayName: "Local" },
    select: { id: true },
  });
  return user.id;
}

const createStrainSchema = z.object({
  name: z.string().trim().min(1).max(120),
  brand: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  type: z
    .enum(["INDICA", "SATIVA", "HYBRID"])
    .optional()
    .transform((v) => (v ? (v as StrainType) : undefined)),
});

export async function createStrain(formData: FormData) {
  const parsed = createStrainSchema.safeParse({
    name: formData.get("name"),
    brand: formData.get("brand"),
    type: formData.get("type"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  const strain = await prisma.strain.create({
    data: {
      name: parsed.data.name,
      brand: parsed.data.brand,
      type: parsed.data.type,
    },
    select: { id: true },
  });

  revalidatePath("/strains");
  redirect(`/strains/${strain.id}`);
}

const createReviewSchema = z.object({
  strainId: z.string().trim().min(1),
  rating: z.enum(["ONE", "TWO", "THREE", "FOUR", "FIVE"]),
  consumedAt: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? new Date(v) : undefined)),
  notes: z
    .string()
    .trim()
    .max(4000)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
});

export async function createReview(formData: FormData) {
  const parsed = createReviewSchema.safeParse({
    strainId: formData.get("strainId"),
    rating: formData.get("rating"),
    consumedAt: formData.get("consumedAt"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  const userId = await getOrCreateLocalUserId();

  await prisma.review.create({
    data: {
      userId,
      strainId: parsed.data.strainId,
      rating: parsed.data.rating as ReviewRating,
      consumedAt: parsed.data.consumedAt,
      notes: parsed.data.notes,
    },
  });

  revalidatePath("/reviews");
  redirect("/reviews");
}
