"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { normalizeTagName } from "@/lib/handles";
import { ReviewRating, StrainType, TagKind } from "@prisma/client";

type SessionIdentity = {
  id: string;
  email: string;
};

function getTaxonomyWriterAllowlist(): string[] {
  return (process.env.HEADSTASH_TAXONOMY_WRITE_ALLOWLIST ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0);
}

async function requireSessionIdentity(): Promise<SessionIdentity> {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string; email?: string | null } | undefined;

  let user: { id: string; email: string | null } | null = null;

  if (sessionUser?.id) {
    user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { id: true, email: true },
    });
  }

  if (!user && sessionUser?.email) {
    user = await prisma.user.findUnique({
      where: { email: sessionUser.email.toLowerCase() },
      select: { id: true, email: true },
    });
  }

  if (!user?.email) {
    throw new Error("Unauthorized");
  }

  return {
    id: user.id,
    email: user.email.toLowerCase(),
  };
}

async function requireTaxonomyWriteAccess() {
  const identity = await requireSessionIdentity();
  const allowlist = getTaxonomyWriterAllowlist();

  if (!allowlist.includes(identity.email)) {
    throw new Error("Forbidden");
  }

  return identity;
}

const createStrainSchema = z.object({
  name: z.string().trim().min(1).max(120),
  brand: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  // Keep this aligned with Prisma's StrainType enum.
  type: z.nativeEnum(StrainType).optional(),
});

const createTagSchema = z.object({
  kind: z.nativeEnum(TagKind),
  name: z.string().trim().min(1).max(60).transform((v) => normalizeTagName(v)),
});

export async function createTag(formData: FormData) {
  await requireTaxonomyWriteAccess();

  const parsed = createTagSchema.safeParse({
    kind: formData.get("kind"),
    name: formData.get("name"),
  });

  if (!parsed.success) throw new Error(parsed.error.message);

  await prisma.tag.create({
    data: {
      kind: parsed.data.kind,
      name: parsed.data.name,
    },
  });

  revalidatePath("/tags");
  redirect("/tags");
}

export async function createStrain(formData: FormData) {
  await requireTaxonomyWriteAccess();

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
  // Strain IDs are cuid() by default in Prisma.
  strainId: z.string().trim().cuid(),

  // Keep this aligned with Prisma's ReviewRating enum.
  rating: z.nativeEnum(ReviewRating),

  // Optional tag ids (single-select for v1).
  effectTagId: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined))
    .refine((v) => v === undefined || z.string().cuid().safeParse(v).success, {
      message: "effectTagId must be a cuid",
    }),
  terpeneTagId: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined))
    .refine((v) => v === undefined || z.string().cuid().safeParse(v).success, {
      message: "terpeneTagId must be a cuid",
    }),

  // Accept empty string as undefined; validate date when provided.
  consumedAt: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? new Date(v) : undefined))
    .refine((d) => d === undefined || !Number.isNaN(d.valueOf()), {
      message: "consumedAt must be a valid date",
    }),

  notes: z
    .string()
    .trim()
    .max(4000)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
});

const updateReviewSchema = z.object({
  reviewId: z.string().trim().cuid(),
  rating: z.nativeEnum(ReviewRating),
  effectTagId: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined))
    .refine((v) => v === undefined || z.string().cuid().safeParse(v).success, {
      message: "effectTagId must be a cuid",
    }),
  terpeneTagId: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined))
    .refine((v) => v === undefined || z.string().cuid().safeParse(v).success, {
      message: "terpeneTagId must be a cuid",
    }),
  consumedAt: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? new Date(v) : undefined))
    .refine((d) => d === undefined || !Number.isNaN(d.valueOf()), {
      message: "consumedAt must be a valid date",
    }),
  notes: z
    .string()
    .trim()
    .max(4000)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
});

export async function updateReview(formData: FormData) {
  const parsed = updateReviewSchema.safeParse({
    reviewId: formData.get("reviewId"),
    rating: formData.get("rating"),
    effectTagId: formData.get("effectTagId"),
    terpeneTagId: formData.get("terpeneTagId"),
    consumedAt: formData.get("consumedAt"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) throw new Error(parsed.error.message);

  const identity = await requireSessionIdentity();

  const existing = await prisma.review.findUnique({
    where: { id: parsed.data.reviewId },
    select: { id: true, userId: true },
  });

  if (!existing) throw new Error("Review not found");
  if (existing.userId !== identity.id) throw new Error("Forbidden");

  await prisma.review.update({
    where: { id: parsed.data.reviewId },
    data: {
      rating: parsed.data.rating,
      consumedAt: parsed.data.consumedAt,
      notes: parsed.data.notes,
    },
  });

  // Update effect/terpene tag links (single-select v1): clear existing EFFECT/TERPENE tags, then add new.
  const existingTags = await prisma.reviewTag.findMany({
    where: { reviewId: parsed.data.reviewId },
    include: { tag: { select: { id: true, kind: true } } },
  });

  const tagIdsToRemove = existingTags
    .filter((rt) => rt.tag.kind === TagKind.EFFECT || rt.tag.kind === TagKind.TERPENE)
    .map((rt) => rt.tagId);

  if (tagIdsToRemove.length > 0) {
    await prisma.reviewTag.deleteMany({
      where: {
        reviewId: parsed.data.reviewId,
        tagId: { in: tagIdsToRemove },
      },
    });
  }

  const newTagIds = [parsed.data.effectTagId, parsed.data.terpeneTagId].filter(
    (v): v is string => !!v,
  );

  if (newTagIds.length > 0) {
    const tags = await prisma.tag.findMany({
      where: { id: { in: newTagIds } },
      select: { id: true, kind: true },
    });
    const byId = new Map(tags.map((t) => [t.id, t.kind] as const));

    const toCreate: { reviewId: string; tagId: string }[] = [];
    if (parsed.data.effectTagId) {
      if (byId.get(parsed.data.effectTagId) !== TagKind.EFFECT) {
        throw new Error("Selected effect tag is not an EFFECT tag");
      }
      toCreate.push({ reviewId: parsed.data.reviewId, tagId: parsed.data.effectTagId });
    }
    if (parsed.data.terpeneTagId) {
      if (byId.get(parsed.data.terpeneTagId) !== TagKind.TERPENE) {
        throw new Error("Selected terpene tag is not a TERPENE tag");
      }
      toCreate.push({ reviewId: parsed.data.reviewId, tagId: parsed.data.terpeneTagId });
    }

    if (toCreate.length > 0) {
      await prisma.reviewTag.createMany({
        data: toCreate,
      });
    }
  }

  revalidatePath("/reviews");
  redirect("/reviews");
}

export async function createReview(formData: FormData) {
  const parsed = createReviewSchema.safeParse({
    strainId: formData.get("strainId"),
    rating: formData.get("rating"),
    effectTagId: formData.get("effectTagId"),
    terpeneTagId: formData.get("terpeneTagId"),
    consumedAt: formData.get("consumedAt"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  const identity = await requireSessionIdentity();

  const review = await prisma.review.create({
    data: {
      userId: identity.id,
      strainId: parsed.data.strainId,
      rating: parsed.data.rating,
      consumedAt: parsed.data.consumedAt,
      notes: parsed.data.notes,
    },
    select: { id: true },
  });

  const tagIds = [parsed.data.effectTagId, parsed.data.terpeneTagId].filter(
    (v): v is string => !!v,
  );

  if (tagIds.length > 0) {
    // Safety: ensure tags exist and match their expected kind.
    const tags = await prisma.tag.findMany({
      where: {
        id: { in: tagIds },
      },
      select: { id: true, kind: true },
    });

    const byId = new Map(tags.map((t) => [t.id, t.kind] as const));

    const toCreate: { reviewId: string; tagId: string }[] = [];
    if (parsed.data.effectTagId) {
      if (byId.get(parsed.data.effectTagId) !== TagKind.EFFECT) {
        throw new Error("Selected effect tag is not an EFFECT tag");
      }
      toCreate.push({ reviewId: review.id, tagId: parsed.data.effectTagId });
    }
    if (parsed.data.terpeneTagId) {
      if (byId.get(parsed.data.terpeneTagId) !== TagKind.TERPENE) {
        throw new Error("Selected terpene tag is not a TERPENE tag");
      }
      toCreate.push({ reviewId: review.id, tagId: parsed.data.terpeneTagId });
    }

    if (toCreate.length > 0) {
      await prisma.reviewTag.createMany({
        data: toCreate,
      });
    }
  }

  revalidatePath("/reviews");
  redirect("/reviews");
}
