import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import sharp from "sharp";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

const MAX_BYTES = 2 * 1024 * 1024; // 2MB
const MAX_INPUT_PIXELS = 4096 * 4096;
const AVATAR_STORAGE_DIR = path.join(process.cwd(), ".uploads", "avatars");

const allowedMimeTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

function detectImageMime(buffer: Buffer): "image/png" | "image/jpeg" | "image/webp" | null {
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

async function normalizeAvatar(buffer: Buffer) {
  return sharp(buffer, {
    failOn: "error",
    limitInputPixels: MAX_INPUT_PIXELS,
  })
    .rotate()
    .resize({ width: 512, height: 512, fit: "cover", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("avatar");

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Missing file" }, { status: 400 });
  }

  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "File must be under 2MB" }, { status: 400 });
  }

  if (!allowedMimeTypes.has(file.type)) {
    return NextResponse.json(
      { ok: false, error: "Unsupported file type (png/jpg/webp only)" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
  }

  const uploadedBytes = Buffer.from(await file.arrayBuffer());
  const detectedMime = detectImageMime(uploadedBytes);
  if (!detectedMime) {
    return NextResponse.json(
      { ok: false, error: "Invalid or unsupported image signature" },
      { status: 400 },
    );
  }

  if (detectedMime !== file.type) {
    return NextResponse.json(
      { ok: false, error: "Declared type does not match file signature" },
      { status: 400 },
    );
  }

  let normalizedBytes: Buffer;
  try {
    normalizedBytes = await normalizeAvatar(uploadedBytes);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Image could not be safely processed" },
      { status: 400 },
    );
  }

  const safeName = `${user.id}-${randomUUID()}.webp`;
  await mkdir(AVATAR_STORAGE_DIR, { recursive: true });
  const outPath = path.join(AVATAR_STORAGE_DIR, safeName);
  await writeFile(outPath, normalizedBytes);

  const servedPath = `/api/profile/avatar/${safeName}`;
  await prisma.user.update({
    where: { email: email.toLowerCase() },
    data: { avatarUrl: servedPath },
  });

  return NextResponse.json({ ok: true, avatarUrl: servedPath });
}
