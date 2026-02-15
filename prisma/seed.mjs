import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import prismaPkg from "@prisma/client";
import bcrypt from "bcryptjs";

const { PrismaClient, ReviewRating, StrainType, TagKind } = prismaPkg;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for seeding");
}

const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const users = [
    {
      id: "seed_user_alice",
      email: "alice@example.local",
      handle: "@alice",
      displayName: "Alice",
      bio: "Flavor chaser. Loves citrus-heavy daytime flower.",
    },
    {
      id: "seed_user_bob",
      email: "bob@example.local",
      handle: "@bob",
      displayName: "Bob",
      bio: "Nighttime indicas and balanced hybrids.",
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      create: user,
      update: {
        email: user.email,
        handle: user.handle,
        displayName: user.displayName,
        bio: user.bio,
      },
    });

    await prisma.credential.upsert({
      where: { userId: user.id },
      create: {
        id: `seed_cred_${user.id}`,
        userId: user.id,
        passwordHash,
      },
      update: { passwordHash },
    });
  }

  const strains = [
    {
      id: "seed_strain_blue_dream",
      name: "Blue Dream",
      brand: "Headstash Labs",
      type: StrainType.HYBRID,
      thcPct: 22,
      cbdPct: 0.2,
    },
    {
      id: "seed_strain_northern_lights",
      name: "Northern Lights",
      brand: "Headstash Labs",
      type: StrainType.INDICA,
      thcPct: 24,
      cbdPct: 0.1,
    },
  ];

  for (const strain of strains) {
    await prisma.strain.upsert({
      where: { id: strain.id },
      create: strain,
      update: {
        name: strain.name,
        brand: strain.brand,
        type: strain.type,
        thcPct: strain.thcPct,
        cbdPct: strain.cbdPct,
      },
    });
  }

  const tags = [
    { id: "seed_tag_uplifted", kind: TagKind.EFFECT, name: "uplifted" },
    { id: "seed_tag_relaxed", kind: TagKind.EFFECT, name: "relaxed" },
    { id: "seed_tag_limonene", kind: TagKind.TERPENE, name: "limonene" },
    { id: "seed_tag_myrcene", kind: TagKind.TERPENE, name: "myrcene" },
  ];

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { id: tag.id },
      create: tag,
      update: { kind: tag.kind, name: tag.name },
    });
  }

  const reviews = [
    {
      id: "seed_review_alice_blue_dream",
      userId: "seed_user_alice",
      strainId: "seed_strain_blue_dream",
      rating: ReviewRating.FOUR,
      notes: "Great daytime focus with a citrus finish.",
    },
    {
      id: "seed_review_bob_northern_lights",
      userId: "seed_user_bob",
      strainId: "seed_strain_northern_lights",
      rating: ReviewRating.FIVE,
      notes: "Heavy body melt and calm sleepy landing.",
    },
  ];

  for (const review of reviews) {
    await prisma.review.upsert({
      where: { id: review.id },
      create: review,
      update: {
        userId: review.userId,
        strainId: review.strainId,
        rating: review.rating,
        notes: review.notes,
      },
    });
  }

  const reviewTags = [
    { reviewId: "seed_review_alice_blue_dream", tagId: "seed_tag_uplifted" },
    { reviewId: "seed_review_alice_blue_dream", tagId: "seed_tag_limonene" },
    { reviewId: "seed_review_bob_northern_lights", tagId: "seed_tag_relaxed" },
    { reviewId: "seed_review_bob_northern_lights", tagId: "seed_tag_myrcene" },
  ];

  for (const rt of reviewTags) {
    await prisma.reviewTag.upsert({
      where: { reviewId_tagId: { reviewId: rt.reviewId, tagId: rt.tagId } },
      create: rt,
      update: {},
    });
  }

  const posts = [
    {
      id: "seed_post_alice_intro",
      authorId: "seed_user_alice",
      reviewId: "seed_review_alice_blue_dream",
      body: "Blue Dream batch is super bright today. Great work block companion.",
    },
    {
      id: "seed_post_bob_intro",
      authorId: "seed_user_bob",
      reviewId: "seed_review_bob_northern_lights",
      body: "Northern Lights still undefeated for evening wind-down.",
    },
  ];

  for (const post of posts) {
    await prisma.post.upsert({
      where: { id: post.id },
      create: post,
      update: {
        authorId: post.authorId,
        reviewId: post.reviewId,
        body: post.body,
      },
    });
  }

  await prisma.follow.upsert({
    where: {
      followerId_followingId: {
        followerId: "seed_user_alice",
        followingId: "seed_user_bob",
      },
    },
    create: { followerId: "seed_user_alice", followingId: "seed_user_bob" },
    update: {},
  });

  console.log("Seed complete: users, credentials, strains, tags, reviews, posts, follows");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
