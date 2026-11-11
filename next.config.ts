import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 兼容 Vercel 和 Cloudflare Pages
  output: undefined, // Vercel 默认; CF 改成 "standalone"
};

export default nextConfig;
