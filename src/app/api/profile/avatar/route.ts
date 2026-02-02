import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

const MAX_BYTES = 2 * 1024 * 1024; // 2MB

function extFromMime(mime: string) {
  switch (mime) {
    case "image/png":
      return ".png";
    case "image/jpeg":
      return ".jpg";
    case "image/webp":
      return ".webp";
    default:
      return null;
  }
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
    return NextResponse.json(
      { ok: false, error: "File must be under 2MB" },
      { status: 400 },
    );
  }

  const ext = extFromMime(file.type);
  if (!ext) {
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

  // DEV LOCAL STORAGE ONLY.
  // Writes into /public so Next can serve it during local dev.
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "avatars");
  await mkdir(uploadsDir, { recursive: true });

  const safeName = `${user.id}-${Date.now()}${ext}`;
  const outPath = path.join(uploadsDir, safeName);

  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(outPath, buf);

  const publicPath = `/uploads/avatars/${safeName}`;
  await prisma.user.update({
    where: { email: email.toLowerCase() },
    data: { avatarUrl: publicPath },
  });

  return NextResponse.json({ ok: true, avatarUrl: publicPath });
}
