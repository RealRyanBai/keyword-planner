export async function hashToken(username: string, password: string, secret: string): Promise<string> {
  const normalizedUser = (username || "").trim().toLowerCase();
  const data = new TextEncoder().encode(`${normalizedUser}:${password}:${secret}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyAuthToken(cookieValue: string | undefined): Promise<boolean> {
  const username = process.env.AUTH_USERNAME || "ryan";
  const password = process.env.AUTH_PASSWORD;
  const secret = process.env.AUTH_SECRET || "default-secret";

  if (!password) return true; // 未设置密码则放行
  if (!cookieValue) return false;

  const expected = await hashToken(username, password, secret);
  return cookieValue === expected;
}
