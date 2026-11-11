import { NextResponse, type NextRequest } from "next/server";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};

async function hashToken(password: string, secret: string): Promise<string> {
  const data = new TextEncoder().encode(password + secret);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 放行登录页面本身
  if (pathname === "/login") return NextResponse.next();

  const cookie = req.cookies.get("kp_auth")?.value;
  const password = process.env.AUTH_PASSWORD;
  const secret = process.env.AUTH_SECRET || "default-secret";

  if (!password) return NextResponse.next(); // 未设置密码则不拦截

  const expected = await hashToken(password, secret);

  if (cookie === expected) return NextResponse.next();

  // 未认证 → 跳转登录页
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}
