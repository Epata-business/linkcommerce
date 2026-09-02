import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    }),
    Credentials({
      name: "Email e Senha",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user?.passwordHash) return null;

        const valido = await bcrypt.compare(credentials.password as string, user.passwordHash);
        if (!valido) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role, lojaId: user.lojaId };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        // Busca sempre o role actualizado da BD no momento do login
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          select: { lojaId: true, role: true },
        });
        token.lojaId = dbUser?.lojaId ?? (user as { lojaId?: string }).lojaId;
        token.role = dbUser?.role ?? (user as { role?: string }).role;
      }
      if (trigger === "update" && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { lojaId: true, role: true },
        });
        if (dbUser) {
          token.lojaId = dbUser.lojaId;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { lojaId?: string }).lojaId = token.lojaId as string | undefined;
        (session.user as { role?: string }).role = token.role as string | undefined;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (user.email === "contato.epata@gmail.com") {
        await prisma.user.update({
          where: { email: "contato.epata@gmail.com" },
          data: { role: "ADMIN_PLATAFORMA" },
        });
      }
    },
  },
  pages: {
    signIn: "/entrar",
  },
});
