import { createHmac, timingSafeEqual } from "crypto";

// Zernio API client — server-side only
// Docs: https://docs.zernio.com
// API key stored in ZERNIO_API_KEY env var

const BASE = "https://zernio.com/api/v1";

function getApiKey(): string {
  const key = process.env.ZERNIO_API_KEY;
  if (!key) throw new Error("ZERNIO_API_KEY not configured");
  return key;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  idempotencyKey?: string
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
  };
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Zernio ${method} ${path} → ${res.status}: ${err.slice(0, 200)}`);
  }

  return res.json() as Promise<T>;
}

// ── Profiles ─────────────────────────────────────────────────────────────────

export async function criarPerfilZernio(nome: string): Promise<{ _id: string }> {
  const { data } = await request<{ data: { _id: string } }>("POST", "/profiles", { name: nome });
  return data;
}

// ── Connect OAuth URL ─────────────────────────────────────────────────────────

export async function obterUrlConexao(
  platform: string,
  profileId: string
): Promise<{ authUrl: string }> {
  const { data } = await request<{ data: { authUrl: string } }>(
    "GET",
    `/connect/${platform}?profileId=${profileId}`
  );
  return data;
}

// ── Accounts ──────────────────────────────────────────────────────────────────

export interface ZernioAccount {
  _id: string;
  platform: string;
  name: string;
  profileId: string;
}

export async function listarContas(profileId?: string): Promise<ZernioAccount[]> {
  const qs = profileId ? `?profileId=${profileId}` : "";
  const { data } = await request<{ data: ZernioAccount[] }>("GET", `/accounts${qs}`);
  return data;
}

// ── Posts ─────────────────────────────────────────────────────────────────────

export interface PublicarPostInput {
  content: string;
  platforms: { platform: string; accountId: string }[];
  scheduledFor?: string; // ISO 8601, UTC
  publishNow?: boolean;
  mediaItems?: { url: string; type?: string }[];
  idempotencyKey?: string;
}

export interface ZernioPost {
  _id: string;
  status: "scheduled" | "publishing" | "published" | "failed";
  scheduledFor?: string;
  content: string;
}

export async function publicarPost(input: PublicarPostInput): Promise<ZernioPost> {
  const { idempotencyKey, ...body } = input;
  const { data } = await request<{ data: ZernioPost }>(
    "POST",
    "/posts",
    body,
    idempotencyKey
  );
  return data;
}

export async function obterPost(postId: string): Promise<ZernioPost> {
  const { data } = await request<{ data: ZernioPost }>("GET", `/posts/${postId}`);
  return data;
}

// ── Webhook signature verification ───────────────────────────────────────────

export function verificarAssinaturaZernio(
  rawBody: string,
  signature: string
): boolean {
  const secret = process.env.ZERNIO_WEBHOOK_SECRET;
  if (!secret) return false;

  const computed = createHmac("sha256", Buffer.from(secret))
    .update(rawBody)
    .digest("hex");

  try {
    return timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}
