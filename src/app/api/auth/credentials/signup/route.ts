import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/auth/rateLimit";

const signupSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(8).max(200),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid request" },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();

  const rl = checkRateLimit(`signup:${email}`, { windowMs: 60_000, max: 5 });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Try again later." },
      { status: 429 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Don't leak whether the account exists.
    return NextResponse.json({ ok: true });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  await prisma.user.create({
    data: {
      email,
      credential: {
        create: {
          passwordHash,
        },
      },
    },
  });

  return NextResponse.json({ ok: true });
}
