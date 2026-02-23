export default defineOAuthGoogleEventHandler({
  async onSuccess(event, { user: googleUser }) {
    const email = googleUser.email as string;
    const name = (googleUser.name as string) ?? null;
    const image = (googleUser.picture as string) ?? null;

    await prisma.user.upsert({
      where: { email },
      update: { name, image },
      create: { email, name, image },
    });

    const config = useRuntimeConfig();
    const superAdminEmails = (config.superAdminEmails as string).split(",").filter(Boolean);
    const isSuperAdmin = superAdminEmails.includes(email);

    const dbUser = await prisma.user.findUnique({ where: { email }, select: { isAdmin: true } });
    const isAdmin = isSuperAdmin || (dbUser?.isAdmin ?? false);

    let personId: string | null = null;
    try {
      const people = await getCachedPeople();
      personId = people.find((p) => p.notionEmail === email)?.id ?? null;
    } catch (e) {
      console.error("Failed to resolve personId:", e);
    }

    await setUserSession(event, {
      user: { id: email, email, name, image, personId, isAdmin, isSuperAdmin },
    });

    return sendRedirect(event, "/");
  },
});
