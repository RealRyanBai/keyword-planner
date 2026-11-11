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

export interface KeywordResult {
  keyword: string;
  avgMonthlySearches: number;
  competition: string;
  competitionIndex: number;
  lowBid: number;
  highBid: number;
  monthlyTrend: { year: number; month: string; searches: number }[];
}
