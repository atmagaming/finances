export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  const config = useRuntimeConfig();
  const superAdminEmails = (config.superAdminEmails as string).split(",").filter(Boolean);

  if (!session?.user?.email || !superAdminEmails.includes(session.user.email))
    throw createError({ statusCode: 403, message: "Only super-admin can add admins" });

  const { email } = await readBody<{ email: string }>(event);
  if (!email) throw createError({ statusCode: 400, message: "Email is required" });

  await prisma.user.upsert({
    where: { email },
    update: { isAdmin: true },
    create: { email, isAdmin: true },
  });

  return { success: true };
});
