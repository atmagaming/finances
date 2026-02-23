import { compare } from "bcryptjs";

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody<{ email: string; password: string }>(event);

  if (!email || !password) throw createError({ statusCode: 400, message: "Email and password are required" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash) throw createError({ statusCode: 401, message: "Invalid email or password" });

  const valid = await compare(password, user.passwordHash);
  if (!valid) throw createError({ statusCode: 401, message: "Invalid email or password" });

  const config = useRuntimeConfig();
  const superAdminEmails = (config.superAdminEmails as string).split(",").filter(Boolean);
  const isSuperAdmin = superAdminEmails.includes(email);
  const isAdmin = isSuperAdmin || user.isAdmin;

  let personId: string | null = null;
  try {
    const people = await getCachedPeople();
    personId = people.find((p) => p.notionEmail === email)?.id ?? null;
  } catch (e) {
    console.error("Failed to resolve personId:", e);
  }

  await setUserSession(event, {
    user: { id: user.id, email, name: user.name, image: user.image, personId, isAdmin, isSuperAdmin },
  });

  return { success: true };
});
