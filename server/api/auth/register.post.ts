import { hash } from "bcryptjs";

export default defineEventHandler(async (event) => {
  const { email, password, name } = await readBody<{ email: string; password: string; name?: string }>(event);

  if (!email || !password) throw createError({ statusCode: 400, message: "Email and password are required" });
  if (password.length < 8) throw createError({ statusCode: 400, message: "Password must be at least 8 characters" });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw createError({ statusCode: 409, message: "Email already registered" });

  const passwordHash = await hash(password, 12);
  await prisma.user.create({ data: { email, name, passwordHash } });

  return { success: true };
});
