import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "404: This page could not be found.",
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
