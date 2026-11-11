import { NextResponse, type NextRequest } from "next/server";
import { verifyAuthToken } from "@/lib/auth";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. 如果有人试图访问旧的 /login，直接返回 404，不留任何痕迹
  if (pathname === "/login") {
    return new NextResponse("404 Not Found", { status: 404 });
  }

  // 2. 放行认证接口
  if (pathname === "/api/auth") {
    return NextResponse.next();
  }

  // 3. 对 API 数据接口进行防嗅探保护：未授权请求直接伪装成 404
  if (pathname.startsWith("/api/")) {
    const isAuth = await verifyAuthToken(req.cookies.get("kp_auth")?.value);
    if (!isAuth) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }
  }

  // 4. 其他前端页面正常放行（由页面内部根据 Cookie 决定显示 404 伪装或真实工具，无任何 302/307 重定向）
  return NextResponse.next();
}
