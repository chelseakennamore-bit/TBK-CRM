import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// One-time bootstrap endpoint: creates (or updates) the single admin user
// in production from ADMIN_EMAIL/ADMIN_PASSWORD, gated by SEED_SECRET.
// Intentionally does NOT create any sample/demo data — production only
// ever gets the real admin account. Remove this route once it's been used.
export async function GET(req: Request) {
  const secret = process.env.SEED_SECRET;
  const provided = new URL(req.url).searchParams.get("secret");

  if (!secret || !provided || provided !== secret) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    return NextResponse.json(
      { error: "ADMIN_EMAIL / ADMIN_PASSWORD are not configured." },
      { status: 500 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });

  return NextResponse.json({ ok: true, email });
}
