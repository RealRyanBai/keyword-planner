import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { verifyAuthToken } from "@/lib/auth";
import KeywordPlanner from "@/components/KeywordPlanner";
import SecretLoginForm from "@/components/SecretLoginForm";

interface Props {
  params: Promise<{ secret: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { secret } = await params;
  const configuredSecret = process.env.SECRET_PATH || "ryan-kwords";

  if (secret !== configuredSecret) {
    return {
      title: "404: This page could not be found.",
    };
  }

  return {
    title: "Keyword Planner — Google 关键词精确搜索量",
    description: "基于 Google Ads API 的免费关键词精确搜索量查询工具",
  };
}

export default async function SecretRoutePage({ params }: Props) {
  const { secret } = await params;
  const configuredSecret = process.env.SECRET_PATH || "ryan-kwords";

  // 如果访问的路径不是配置的暗门，直接返回真实的 404
  if (secret !== configuredSecret) {
    notFound();
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("kp_auth")?.value;
  const isAuth = await verifyAuthToken(token);

  if (!isAuth) {
    return <SecretLoginForm secretPath={configuredSecret} />;
  }

  return <KeywordPlanner secretPath={configuredSecret} />;
}
