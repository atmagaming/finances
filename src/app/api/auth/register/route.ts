import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { email, password, name } = (await request.json()) as { email: string; password: string; name?: string };

  if (!email || !password) return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  if (password.length < 8)
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

  const passwordHash = await hash(password, 12);
  await prisma.user.create({ data: { email, name, passwordHash } });

  return NextResponse.json({ success: true }, { status: 201 });
}
