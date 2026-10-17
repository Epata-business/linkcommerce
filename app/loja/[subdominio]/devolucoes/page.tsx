import { redirect } from "next/navigation";

interface PageProps { params: { subdominio: string } }

export default function DevolucoesPage({ params }: PageProps) {
  redirect(`/loja/${params.subdominio}`);
}
