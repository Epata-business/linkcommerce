// -----------------------------------------------------------------------------
// lib/pos-db.ts
// Camada de acesso ao IndexedDB usada pelo POS para guardar vendas localmente
// quando não há internet, e sincronizá-las automaticamente quando a ligação
// volta (ver store/pos-store.ts e app/pos/page.tsx).
//
// Usa a API nativa do browser (sem dependências externas) para manter o
// esqueleto simples e fácil de auditar.
// -----------------------------------------------------------------------------

const DB_NAME = "linkcommerce-pos";
const DB_VERSION = 1;
const STORE_VENDAS = "vendas_pendentes";

export interface VendaPosOffline {
  clientUuid: string; // gerado no browser, usado para deduplicar no servidor
  lojaId: string;
  itens: {
    produtoId: string;
    varianteId?: string;
    titulo: string;
    quantidade: number;
    precoUnitario: number;
  }[];
  total: number;
  clienteEmail?: string;
  criadoEm: string; // ISO string
  sincronizada: boolean;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_VENDAS)) {
        const store = db.createObjectStore(STORE_VENDAS, { keyPath: "clientUuid" });
        store.createIndex("sincronizada", "sincronizada");
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function guardarVendaOffline(venda: VendaPosOffline): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_VENDAS, "readwrite");
    tx.objectStore(STORE_VENDAS).put(venda);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function listarVendasPendentes(): Promise<VendaPosOffline[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_VENDAS, "readonly");
    const request = tx.objectStore(STORE_VENDAS).getAll();
    request.onsuccess = () =>
      resolve((request.result as VendaPosOffline[]).filter((v) => !v.sincronizada));
    request.onerror = () => reject(request.error);
  });
}

export async function marcarComoSincronizada(clientUuid: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_VENDAS, "readwrite");
    const store = tx.objectStore(STORE_VENDAS);
    const getRequest = store.get(clientUuid);
    getRequest.onsuccess = () => {
      const venda = getRequest.result as VendaPosOffline | undefined;
      if (venda) {
        venda.sincronizada = true;
        store.put(venda);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
