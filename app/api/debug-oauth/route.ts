import { NextResponse } from "next/server";
export async function GET() {
  const id = process.env.GOOGLE_CLIENT_ID ?? "";
  return NextResponse.json({
    prefix: id.slice(0, 40),
    suffix: id.slice(-10),
    len: id.length
  });
}
