import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getLojaId(): Promise<string> {
  const session = await auth();
  if (!session?.user) redirect("/entrar");

  const role = (session.user as { role?: string }).role;

  // Admin pode impersonar qualquer loja via cookie
  if (role === "ADMIN_PLATAFORMA") {
    const jar = cookies();
    const override = jar.get("admin_loja_override")?.value;
    if (override) return override;
    redirect("/admin");
  }

  let lojaId = session.user.lojaId as string | undefined;

  if (!lojaId && session.user.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { lojaId: true },
    });
    lojaId = dbUser?.lojaId ?? undefined;
  }

  if (!lojaId) redirect("/onboarding");
  return lojaId;
}
