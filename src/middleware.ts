import { NextResponse, type NextRequest } from "next/server";
import { verifyAuthToken } from "@/lib/auth";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. 放行登录验证与退出接口
  if (pathname === "/api/auth") {
    return NextResponse.next();
  }

  // 2. 对 API 数据接口进行防嗅探保护：未授权请求直接伪装成 404
  if (pathname.startsWith("/api/")) {
    const isAuth = await verifyAuthToken(req.cookies.get("kp_auth")?.value);
    if (!isAuth) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }
  }

  return NextResponse.next();
}
