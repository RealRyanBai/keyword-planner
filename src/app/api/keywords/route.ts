import { NextResponse, type NextRequest } from "next/server";
import { queryHistorical, queryIdeas } from "@/lib/ads-api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      keywords: raw,
      mode = "historical",
      location = "us",
      language = "en",
      maxIdeas = 50,
      dateRange,
    } = body;

    // 解析关键词（逗号或换行分隔，去重）
    const kws = [...new Set(
      String(raw || "")
        .replace(/,/g, "\n")
        .split("\n")
        .map((s: string) => s.trim())
        .filter(Boolean)
    )];

    if (!kws.length) {
      return NextResponse.json({ error: "请输入至少一个关键词" }, { status: 400 });
    }

    const results =
      mode === "ideas"
        ? await queryIdeas(kws, location, language, maxIdeas, dateRange)
        : await queryHistorical(kws, location, language, dateRange);

    return NextResponse.json({ results, count: results.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[keywords API]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
