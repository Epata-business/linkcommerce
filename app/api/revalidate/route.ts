import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "ADMIN_PLATAFORMA") {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }
  revalidatePath("/", "page");
  return NextResponse.json({ revalidated: true, now: Date.now() });
}
