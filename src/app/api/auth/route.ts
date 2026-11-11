import { NextResponse, type NextRequest } from "next/server";
import { hashToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    const expectedUser = (process.env.AUTH_USERNAME || "ryan").trim().toLowerCase();
    const expectedPass = process.env.AUTH_PASSWORD;
    const secret = process.env.AUTH_SECRET || "default-secret";

    const inputUser = (username || "").trim().toLowerCase();

    if (!expectedPass || inputUser !== expectedUser || password !== expectedPass) {
      return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
    }

    const token = await hashToken(inputUser, password, secret);
    const res = NextResponse.json({ ok: true, username: inputUser });

    res.cookies.set("kp_auth", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 天
      path: "/",
    });

    return res;
  } catch {
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
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
