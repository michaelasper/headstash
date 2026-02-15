import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

const AVATAR_STORAGE_DIR = path.join(process.cwd(), ".uploads", "avatars");
const SAFE_FILE_NAME = /^[a-zA-Z0-9_-]+\.webp$/;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;

  if (!SAFE_FILE_NAME.test(file)) {
    return NextResponse.json({ ok: false, error: "Invalid avatar path" }, { status: 400 });
  }

  const absoluteBase = path.resolve(AVATAR_STORAGE_DIR);
  const absoluteTarget = path.resolve(AVATAR_STORAGE_DIR, file);

  if (!absoluteTarget.startsWith(`${absoluteBase}${path.sep}`)) {
    return NextResponse.json({ ok: false, error: "Invalid avatar path" }, { status: 400 });
  }

  try {
    const bytes = await readFile(absoluteTarget);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Avatar not found" }, { status: 404 });
  }
}
