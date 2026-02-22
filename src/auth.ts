import NextAuth from "next-auth";
import Notion from "next-auth/providers/notion";
import { getCachedPeople } from "@/lib/data";

const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    {
      ...Notion({
        clientId: process.env.AUTH_NOTION_ID,
        clientSecret: process.env.AUTH_NOTION_SECRET,
        redirectUri: `${baseUrl}/api/auth/callback/notion`,
      }),
      checks: ["state"],
    },
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, profile }) {
      if (profile) {
        const email =
          (profile as { owner?: { user?: { person?: { email?: string } } } }).owner?.user?.person?.email ??
          token.email ??
          "";
        try {
          const people = await getCachedPeople();
          token.personId = people.find((p) => p.notionEmail === email)?.id ?? null;
        } catch (e) {
          console.error("Failed to resolve personId during login:", e);
          token.personId = null;
        }
      }
      return token;
    },
    session({ session, token }) {
      return { ...session, user: { ...session.user, personId: token.personId as string | null } };
    },
  },
  pages: { signIn: "/login" },
});
