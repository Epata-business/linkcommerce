"use client";

import { Button } from "@/components/ui/button";
import { ProdutoFormDialog } from "@/components/dashboard/produto-form-dialog";
import { atualizarProduto, removerProduto } from "@/app/(dashboard)/dashboard/produtos/actions";

interface Props {
  produto: {
    id: string;
    titulo: string;
    descricao: string;
    preco: number;
    sku: string;
    stock: number;
    imagemUrl: string;
  };
}

export function ProdutoRowActions({ produto }: Props) {
  return (
    <div className="flex justify-end gap-2">
      <ProdutoFormDialog
        trigger={
          <Button size="sm" variant="outline">
            Editar
          </Button>
        }
        produtoExistente={produto}
        onSubmitAction={(formData) => atualizarProduto(produto.id, formData)}
      />
      <Button
        size="sm"
        variant="destructive"
        onClick={() => {
          if (confirm(`Remover "${produto.titulo}"?`)) removerProduto(produto.id);
        }}
      >
        Remover
      </Button>
    </div>
  );
}
