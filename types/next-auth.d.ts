import "next-auth";

declare module "next-auth" {
  interface User {
    lojaId?: string | null;
    role?: string;
  }
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      lojaId?: string | null;
      role?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    lojaId?: string | null;
    role?: string;
  }
}
