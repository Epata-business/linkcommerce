import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Providers OAuth só são registados se AMBAS as variáveis estiverem definidas e não-vazias
// — NextAuth v5 lança Configuration error se clientId ou clientSecret forem undefined/""
const oauthProviders = [
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? Google({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET })
    : null,
  process.env.GITHUB_ID && process.env.GITHUB_SECRET
    ? GitHub({ clientId: process.env.GITHUB_ID, clientSecret: process.env.GITHUB_SECRET })
    : null,
  process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET
    ? Facebook({ clientId: process.env.FACEBOOK_CLIENT_ID, clientSecret: process.env.FACEBOOK_CLIENT_SECRET })
    : null,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
].filter(Boolean) as any[];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    ...oauthProviders,
    Credentials({
      name: "Email e Senha",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const emailNorm = (credentials.email as string).toLowerCase().trim();
        const user = await prisma.user.findUnique({
          where: { email: emailNorm },
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
        const isAdmin = user.email === "contato.epata@gmail.com";
        if (isAdmin) {
          // Garante role admin no token — Prisma update é best-effort (não bloqueia login se falhar)
          token.role = "ADMIN_PLATAFORMA";
          try {
            await prisma.user.update({
              where: { email: "contato.epata@gmail.com" },
              data: { role: "ADMIN_PLATAFORMA" },
            });
          } catch { /* silencia erros de DB — role já está no token */ }
        } else {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: user.email! },
              select: { lojaId: true, role: true },
            });
            token.lojaId = dbUser?.lojaId ?? (user as { lojaId?: string }).lojaId;
            token.role = dbUser?.role ?? (user as { role?: string }).role;
          } catch {
            token.lojaId = (user as { lojaId?: string }).lojaId;
            token.role = (user as { role?: string }).role;
          }
        }
      }
      if (trigger === "update" && token.sub) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { lojaId: true, role: true },
          });
          if (dbUser) {
            token.lojaId = dbUser.lojaId;
            token.role = dbUser.role;
          }
        } catch { /* mantém token existente se DB falhar */ }
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
