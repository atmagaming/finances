declare module "#auth-utils" {
  interface User {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    personId: string | null;
    isAdmin: boolean;
    isSuperAdmin: boolean;
  }
}

export {};
