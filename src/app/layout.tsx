import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Keyword Planner — Google 关键词精确搜索量",
  description: "基于 Google Ads API 的免费关键词精确搜索量查询工具",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
