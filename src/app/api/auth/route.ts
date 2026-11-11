import { NextResponse, type NextRequest } from "next/server";

async function hashToken(password: string, secret: string): Promise<string> {
  const data = new TextEncoder().encode(password + secret);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const expected = process.env.AUTH_PASSWORD;
  const secret = process.env.AUTH_SECRET || "default-secret";

  if (!expected || password !== expected) {
    return NextResponse.json({ error: "wrong" }, { status: 401 });
  }

  const token = await hashToken(password, secret);
  const res = NextResponse.json({ ok: true });

  res.cookies.set("kp_auth", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 天
    path: "/",
  });

  return res;
}
