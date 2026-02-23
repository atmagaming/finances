export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session?.user?.isAdmin) throw createError({ statusCode: 403, message: "Forbidden" });

  const config = useRuntimeConfig();
  const superAdminEmails = (config.superAdminEmails as string).split(",").filter(Boolean);

  const admins = await prisma.user.findMany({
    where: { isAdmin: true },
    select: { id: true, email: true, name: true },
  });

  return { admins, superAdminEmails };
});
