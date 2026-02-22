declare module "@auth/core/types" {
  interface User {
    personId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    personId?: string | null;
  }
}
