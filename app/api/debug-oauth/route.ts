import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET() {
  const id = process.env.GOOGLE_CLIENT_ID ?? "";
  return NextResponse.json({
    prefix: id.slice(0, 40),
    suffix: id.slice(-10),
    len: id.length
  }, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" }
  });
}
