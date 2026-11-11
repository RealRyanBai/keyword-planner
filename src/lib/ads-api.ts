/**
 * Google Ads API REST 客户端
 * 纯 fetch 实现，兼容 Vercel / Cloudflare Edge
 */

import { GEO_LOCATIONS, LANGUAGES, type KeywordResult } from "./constants";

const API_VERSION = process.env.GOOGLE_ADS_API_VERSION || "v26";
const BASE = `https://googleads.googleapis.com/${API_VERSION}`;

// ── 缓存 Access Token（同一实例内复用，约 1 小时有效）───────
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OAuth token refresh failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  };
  return cachedToken.token;
}

function authHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    "developer-token": process.env.GOOGLE_DEVELOPER_TOKEN!,
    "login-customer-id": process.env.GOOGLE_LOGIN_CUSTOMER_ID!,
    "Content-Type": "application/json",
  };
}

// ── 解析 API 返回的指标 ─────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseMetrics(keyword: string, metrics: any): KeywordResult {
  const monthly: KeywordResult["monthlyTrend"] = [];
  if (metrics?.monthlySearchVolumes) {
    for (const m of metrics.monthlySearchVolumes.slice(-12)) {
      monthly.push({
        year: m.year ?? 0,
        month: m.month ?? "",
        searches: Number(m.monthlySearches ?? 0),
      });
    }
  }

  return {
    keyword,
    avgMonthlySearches: Number(metrics?.avgMonthlySearches ?? 0),
    competition: metrics?.competition ?? "UNSPECIFIED",
    competitionIndex: Number(metrics?.competitionIndex ?? 0),
    lowBid: Number(metrics?.lowTopOfPageBidMicros ?? 0) / 1_000_000,
    highBid: Number(metrics?.highTopOfPageBidMicros ?? 0) / 1_000_000,
    monthlyTrend: monthly,
  };
}

// ── Historical Metrics（精确查询指定关键词）──────────────
export async function queryHistorical(
  keywords: string[],
  location: string,
  language: string
): Promise<KeywordResult[]> {
  const accessToken = await getAccessToken();
  const customerId = process.env.GOOGLE_LOGIN_CUSTOMER_ID!;

  const geo = GEO_LOCATIONS[location];
  const lang = LANGUAGES[language] || LANGUAGES.en;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: any = {
    keywords,
    keywordPlanNetwork: "GOOGLE_SEARCH",
  };

  if (geo?.id) {
    body.geoTargetConstants = [`geoTargetConstants/${geo.id}`];
  }
  body.language = `languageConstants/${lang.id}`;

  const res = await fetch(
    `${BASE}/customers/${customerId}:generateKeywordHistoricalMetrics`,
    {
      method: "POST",
      headers: authHeaders(accessToken),
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return (data.results || []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (r: any) => parseMetrics(r.text, r.keywordMetrics)
  );
}

// ── Keyword Ideas（拓展相关关键词）───────────────────────
export async function queryIdeas(
  keywords: string[],
  location: string,
  language: string,
  maxResults: number = 50
): Promise<KeywordResult[]> {
  const accessToken = await getAccessToken();
  const customerId = process.env.GOOGLE_LOGIN_CUSTOMER_ID!;

  const geo = GEO_LOCATIONS[location];
  const lang = LANGUAGES[language] || LANGUAGES.en;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: any = {
    keywordSeed: { keywords },
    keywordPlanNetwork: "GOOGLE_SEARCH",
  };

  if (geo?.id) {
    body.geoTargetConstants = [`geoTargetConstants/${geo.id}`];
  }
  body.language = `languageConstants/${lang.id}`;

  const res = await fetch(
    `${BASE}/customers/${customerId}:generateKeywordIdeas`,
    {
      method: "POST",
      headers: authHeaders(accessToken),
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return (data.results || [])
    .slice(0, maxResults)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((r: any) => parseMetrics(r.text, r.keywordIdeaMetrics));
}
