// ── 地区与语言映射 ──────────────────────────────────────

export const GEO_LOCATIONS: Record<string, { id: string; label: string }> = {
  global: { id: "",     label: "🌍 全球 Global" },
  us:     { id: "2840", label: "🇺🇸 美国 United States" },
  uk:     { id: "2826", label: "🇬🇧 英国 United Kingdom" },
  ca:     { id: "2124", label: "🇨🇦 加拿大 Canada" },
  au:     { id: "2036", label: "🇦🇺 澳大利亚 Australia" },
  de:     { id: "2276", label: "🇩🇪 德国 Germany" },
  fr:     { id: "2250", label: "🇫🇷 法国 France" },
  es:     { id: "2724", label: "🇪🇸 西班牙 Spain" },
  it:     { id: "2380", label: "🇮🇹 意大利 Italy" },
  nl:     { id: "2528", label: "🇳🇱 荷兰 Netherlands" },
  se:     { id: "2752", label: "🇸🇪 瑞典 Sweden" },
  jp:     { id: "2392", label: "🇯🇵 日本 Japan" },
  kr:     { id: "2410", label: "🇰🇷 韩国 South Korea" },
  cn:     { id: "2156", label: "🇨🇳 中国 China" },
  hk:     { id: "2344", label: "🇭🇰 香港 Hong Kong" },
  tw:     { id: "2158", label: "🇹🇼 台湾 Taiwan" },
  sg:     { id: "2702", label: "🇸🇬 新加坡 Singapore" },
  in:     { id: "2356", label: "🇮🇳 印度 India" },
  br:     { id: "2076", label: "🇧🇷 巴西 Brazil" },
  mx:     { id: "2484", label: "🇲🇽 墨西哥 Mexico" },
};

export const LANGUAGES: Record<string, { id: string; label: string }> = {
  en:    { id: "1000", label: "English" },
  zh_cn: { id: "1017", label: "简体中文" },
  zh_tw: { id: "1018", label: "繁體中文" },
  es:    { id: "1003", label: "Español" },
  de:    { id: "1001", label: "Deutsch" },
  fr:    { id: "1002", label: "Français" },
  ja:    { id: "1005", label: "日本語" },
  ko:    { id: "1012", label: "한국어" },
  pt:    { id: "1014", label: "Português" },
  it:    { id: "1004", label: "Italiano" },
  nl:    { id: "1010", label: "Nederlands" },
};

// ── 时间区间预设 ────────────────────────────────────────
export const DATE_RANGES: Record<string, { label: string; monthsCount: number }> = {
  past_12:    { label: "最近 12 个月 (标准默认)", monthsCount: 12 },
  past_24:    { label: "最近 24 个月 (2 年趋势)", monthsCount: 24 },
  past_6:     { label: "最近 6 个月 (近半年)", monthsCount: 6 },
  past_3:     { label: "最近 3 个月 (近一季度)", monthsCount: 3 },
  last_month: { label: "上个月 (最新单月数据)", monthsCount: 1 },
  custom:     { label: "自定义月份区间...", monthsCount: 0 },
};

export const MONTH_TO_NUM: Record<string, number> = {
  JANUARY: 1, FEBRUARY: 2, MARCH: 3, APRIL: 4, MAY: 5, JUNE: 6,
  JULY: 7, AUGUST: 8, SEPTEMBER: 9, OCTOBER: 10, NOVEMBER: 11, DECEMBER: 12,
};

export const NUM_TO_MONTH = [
  "", "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
];

export function formatMonthCN(month: string | number): string {
  if (typeof month === "number") return `${month}月`;
  const num = MONTH_TO_NUM[month.toUpperCase()] || month;
  return `${num}月`;
}

export interface MonthlyVolumeItem {
  year: number;
  month: string;
  searches: number;
}

export interface KeywordResult {
  keyword: string;
  avgMonthlySearches: number;
  competition: string;
  competitionIndex: number;
  lowBid: number;
  highBid: number;
  monthlyTrend: MonthlyVolumeItem[];
  dateRangeStr?: string;
}
