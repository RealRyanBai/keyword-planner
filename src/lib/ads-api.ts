/**
 * Google Ads API REST 客户端
 * 纯 fetch 实现，兼容 Vercel / Cloudflare Edge
 */

import {
  GEO_LOCATIONS,
  LANGUAGES,
  NUM_TO_MONTH,
  formatMonthCN,
  type KeywordResult,
  type MonthlyVolumeItem,
} from "./constants";

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

// ── 构造时间区间 ────────────────────────────────────────
export interface DateRangeOption {
  type: string;
  startYear?: number;
  startMonth?: number;
  endYear?: number;
  endMonth?: number;
}

function buildYearMonthRange(dateRange?: DateRangeOption) {
  if (!dateRange || dateRange.type === "past_12") {
    // 默认最近 12 个月由 Google Ads 自动精准处理最新完整月
    return undefined;
  }

  // Google 关键词数据通常截止到上个月或前两个月已结算月份
  // 动态以当前日期的前 2 个月作为最新的完整基准月
  const now = new Date();
  const baseEnd = new Date(now.getFullYear(), now.getMonth() - 2, 1);

  if (
    dateRange.type === "custom" &&
    dateRange.startYear &&
    dateRange.startMonth &&
    dateRange.endYear &&
    dateRange.endMonth
  ) {
    return {
      start: {
        year: dateRange.startYear,
        month: NUM_TO_MONTH[dateRange.startMonth],
      },
      end: {
        year: dateRange.endYear,
        month: NUM_TO_MONTH[dateRange.endMonth],
      },
    };
  }

  let monthsBack = 12;
  if (dateRange.type === "past_24") monthsBack = 24;
  else if (dateRange.type === "past_6") monthsBack = 6;
  else if (dateRange.type === "past_3") monthsBack = 3;
  else if (dateRange.type === "last_month") monthsBack = 1;

  const baseStart = new Date(baseEnd.getFullYear(), baseEnd.getMonth() - (monthsBack - 1), 1);

  return {
    start: {
      year: baseStart.getFullYear(),
      month: NUM_TO_MONTH[baseStart.getMonth() + 1],
    },
    end: {
      year: baseEnd.getFullYear(),
      month: NUM_TO_MONTH[baseEnd.getMonth() + 1],
    },
  };
}

// ── 解析 API 返回的指标 ─────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseMetrics(keyword: string, metrics: any): KeywordResult {
  const monthly: MonthlyVolumeItem[] = [];
  let sum = 0;
  if (metrics?.monthlySearchVolumes) {
    for (const m of metrics.monthlySearchVolumes) {
      const searches = Number(m.monthlySearches ?? 0);
      sum += searches;
      monthly.push({
        year: Number(m.year ?? 0),
        month: String(m.month ?? ""),
        searches,
      });
    }
  }

  // 计算所选时间段内的实际月均搜索量
  let avgMonthly = Number(metrics?.avgMonthlySearches ?? 0);
  if (monthly.length > 0) {
    avgMonthly = Math.round(sum / monthly.length);
  }

  // 格式化区间时间跨度文字描述
  let dateRangeStr = "";
  if (monthly.length > 0) {
    const first = monthly[0];
    const last = monthly[monthly.length - 1];
    dateRangeStr = `${first.year}年${formatMonthCN(first.month)} ~ ${last.year}年${formatMonthCN(last.month)} (共 ${monthly.length} 个月)`;
  }

  return {
    keyword,
    avgMonthlySearches: avgMonthly,
    competition: metrics?.competition ?? "UNSPECIFIED",
    competitionIndex: Number(metrics?.competitionIndex ?? 0),
    lowBid: Number(metrics?.lowTopOfPageBidMicros ?? 0) / 1_000_000,
    highBid: Number(metrics?.highTopOfPageBidMicros ?? 0) / 1_000_000,
    monthlyTrend: monthly,
    dateRangeStr,
  };
}

// ── Historical Metrics（精确查询指定关键词）──────────────
export async function queryHistorical(
  keywords: string[],
  location: string,
  language: string,
  dateRange?: DateRangeOption
): Promise<KeywordResult[]> {
  const accessToken = await getAccessToken();
  const customerId = process.env.GOOGLE_LOGIN_CUSTOMER_ID!;

  const geo = GEO_LOCATIONS[location];
  const lang = LANGUAGES[language] || LANGUAGES.en;
  const ymRange = buildYearMonthRange(dateRange);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: any = {
    keywords,
    keywordPlanNetwork: "GOOGLE_SEARCH",
  };

  if (geo?.id) {
    body.geoTargetConstants = [`geoTargetConstants/${geo.id}`];
  }
  body.language = `languageConstants/${lang.id}`;

  if (ymRange) {
    body.historicalMetricsOptions = {
      yearMonthRange: ymRange,
    };
  }

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
  maxResults: number = 50,
  dateRange?: DateRangeOption
): Promise<KeywordResult[]> {
  const accessToken = await getAccessToken();
  const customerId = process.env.GOOGLE_LOGIN_CUSTOMER_ID!;

  const geo = GEO_LOCATIONS[location];
  const lang = LANGUAGES[language] || LANGUAGES.en;
  const ymRange = buildYearMonthRange(dateRange);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: any = {
    keywordSeed: { keywords },
    keywordPlanNetwork: "GOOGLE_SEARCH",
  };

  if (geo?.id) {
    body.geoTargetConstants = [`geoTargetConstants/${geo.id}`];
  }
  body.language = `languageConstants/${lang.id}`;

  if (ymRange) {
    body.historicalMetricsOptions = {
      yearMonthRange: ymRange,
    };
  }

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
