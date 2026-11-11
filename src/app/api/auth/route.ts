import { NextResponse, type NextRequest } from "next/server";
import { hashToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const expected = process.env.AUTH_PASSWORD;
    const secret = process.env.AUTH_SECRET || "default-secret";

    if (!expected || password !== expected) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
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
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("kp_auth", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return res;
}
