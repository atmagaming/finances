import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { getCachedPeople } from "@/lib/data";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials.email as string;
        const password = credentials.password as string;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const valid = await compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        await prisma.user.upsert({
          where: { email: user.email },
          update: { name: user.name, image: user.image },
          create: { email: user.email, name: user.name, image: user.image },
        });
      }
      return true;
    },
    async jwt({ token, trigger }) {
      if (trigger === "signIn" || trigger === "signUp" || token.personId === undefined) {
        const email = token.email ?? "";
        try {
          const people = await getCachedPeople();
          token.personId = people.find((p) => p.notionEmail === email)?.id ?? null;
        } catch (e) {
          console.error("Failed to resolve personId:", e);
          token.personId = token.personId ?? null;
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
