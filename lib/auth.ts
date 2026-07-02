import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// -----------------------------------------------------------------------------
// lib/auth.ts
// NextAuth.js v5. Suporta email/senha e Google, conforme pedido
// ("O utilizador pode criar conta via email/senha ou Google").
// A sessão inclui lojaId e role para que o middleware (middleware.ts) e os
// Server Actions saibam a que tenant/permissões o pedido pertence.
// -----------------------------------------------------------------------------

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
        token.lojaId = (user as { lojaId?: string }).lojaId;
        token.role = (user as { role?: string }).role;
      }
      // Quando update() é chamado no cliente (ex: após criar loja),
      // vai buscar o lojaId actualizado directamente à base de dados.
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
  pages: {
    signIn: "/entrar",
  },
});
