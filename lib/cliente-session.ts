import { createHmac } from "crypto";
import { cookies } from "next/headers";

const SECRET = process.env.AUTH_SECRET ?? "lc-fallback-secret";
const COOKIE = "lc_cliente";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

export interface ClienteSession {
  clienteId: string;
  lojaId: string;
  email: string;
  nome: string | null;
}

function sign(payload: ClienteSession): string {
  const data = JSON.stringify(payload);
  const b64 = Buffer.from(data).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(b64).digest("base64url");
  return `${b64}.${sig}`;
}

function verify(token: string): ClienteSession | null {
  const [b64, sig] = token.split(".");
  if (!b64 || !sig) return null;
  const expected = createHmac("sha256", SECRET).update(b64).digest("base64url");
  if (expected !== sig) return null;
  try {
    return JSON.parse(Buffer.from(b64, "base64url").toString("utf8")) as ClienteSession;
  } catch {
    return null;
  }
}

export async function setClienteSession(session: ClienteSession) {
  const store = await cookies();
  store.set(COOKIE, sign(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function getClienteSession(): Promise<ClienteSession | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  return verify(token);
}

export async function clearClienteSession() {
  const store = await cookies();
  store.delete(COOKIE);
}
