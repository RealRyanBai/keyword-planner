import { Suspense } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth";
import KeywordPlanner from "@/components/KeywordPlanner";
import Decoy404 from "@/components/Decoy404";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const token = cookieStore.get("kp_auth")?.value;
  const isAuth = await verifyAuthToken(token);

  if (isAuth) {
    return {
      title: "Keyword Planner — Google 关键词精确搜索量",
      description: "基于 Google Ads API 的免费关键词精确搜索量查询工具",
    };
  }

  return {
    title: "404: This page could not be found.",
    description: "",
  };
}

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get("kp_auth")?.value;
  const isAuth = await verifyAuthToken(token);

  if (!isAuth) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-black" />}>
        <Decoy404 />
      </Suspense>
    );
  }

  return <KeywordPlanner />;
}
