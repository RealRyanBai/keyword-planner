"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { GEO_LOCATIONS, LANGUAGES, type KeywordResult } from "@/lib/constants";
import { useTheme } from "@/lib/useTheme";
import HistoryDrawer, { QueryHistoryItem } from "./HistoryDrawer";

// ════════════════════════════════════════════════════════════
//  Sparkline 迷你趋势图
// ════════════════════════════════════════════════════════════

function Sparkline({ data }: { data: KeywordResult["monthlyTrend"] }) {
  if (!data?.length) return <span className="text-slate-400 dark:text-zinc-600">—</span>;

  const w = 100, h = 26, pad = 2;
  const vals = data.map((d) => d.searches);
  const max = Math.max(...vals) || 1;
  const min = Math.min(...vals);
  const range = max - min || 1;

  const pts = vals
    .map((v, i) => {
      const x = pad + (i / (vals.length - 1 || 1)) * (w - 2 * pad);
      const y = pad + (1 - (v - min) / range) * (h - 2 * pad);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const area = `${pts} ${w - pad},${h - pad} ${pad},${h - pad}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-[100px] h-[26px]">
      <polygon points={area} className="fill-indigo-500/15 dark:fill-indigo-500/20" />
      <polyline
        points={pts}
        fill="none"
        className="stroke-indigo-600 dark:stroke-indigo-400"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ════════════════════════════════════════════════════════════
//  竞争度徽章
// ════════════════════════════════════════════════════════════

const compStyles: Record<string, string> = {
  LOW:         "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20",
  MEDIUM:      "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20",
  HIGH:        "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400 border border-red-200 dark:border-red-500/20",
  UNSPECIFIED: "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700",
};

function CompBadge({ level }: { level: string }) {
  const cls = compStyles[level] || compStyles.UNSPECIFIED;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold tracking-wide ${cls}`}>
      {level}
    </span>
  );
}

// ════════════════════════════════════════════════════════════
//  Toast 提示
// ════════════════════════════════════════════════════════════

function Toast({ msg, isError }: { msg: string; isError?: boolean }) {
  if (!msg) return null;
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 sm:px-5 sm:py-3
        rounded-xl text-xs sm:text-sm font-medium shadow-2xl animate-slide-up max-w-[90vw] text-center
        ${isError
          ? "bg-red-50 border border-red-200 text-red-800 dark:bg-red-950/90 dark:border-red-800 dark:text-red-300"
          : "bg-white border border-slate-200 text-slate-800 dark:bg-[#1a1a26] dark:border-zinc-700 dark:text-zinc-200"
        }`}
    >
      {msg}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  主组件
// ════════════════════════════════════════════════════════════

type SortKey = keyof KeywordResult;

export default function KeywordPlanner({ secretPath }: { secretPath?: string }) {
  const { theme, toggleTheme } = useTheme();

  // ── 状态 ──────────────────────────────────────────────
  const [keywords, setKeywords] = useState("");
  const [mode, setMode] = useState<"historical" | "ideas">("historical");
  const [location, setLocation] = useState("us");
  const [language, setLanguage] = useState("en");
  const [maxIdeas, setMaxIdeas] = useState(50);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<KeywordResult[]>([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [toast, setToast] = useState({ msg: "", isError: false });
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ── 本地历史加载 ──────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem("kp_history");
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch {}
  }, []);

  // ── Toast 辅助 ────────────────────────────────────────
  const showToast = useCallback((msg: string, isError = false) => {
    setToast({ msg, isError });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast({ msg: "", isError: false }), 3000);
  }, []);

  // ── 退出登录 ──────────────────────────────────────────
  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    window.location.reload();
  };

  // ── 关键词解析 ────────────────────────────────────────
  const parseKws = useCallback(
    () =>
      keywords
        .replace(/,/g, "\n")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    [keywords]
  );

  const kwCount = parseKws().length;

  // ── 查询 ──────────────────────────────────────────────
  const doQuery = useCallback(async () => {
    if (!kwCount) {
      showToast("请输入至少一个关键词", true);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords: parseKws().join("\n"),
          mode,
          location,
          language,
          maxIdeas,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResults(data.results);
      setHasQueried(true);
      setSortKey(null);
      showToast(`✓ 查询完成，共 ${data.count} 条结果`);

      // 自动保存到历史记录 (去重并保留最近 50 条)
      if (data.results && data.results.length > 0) {
        const now = new Date();
        const dateStr = `${now.getMonth() + 1}/${now.getDate()} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        const newItem: QueryHistoryItem = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          dateStr,
          keywords: parseKws().join(", "),
          keywordCount: parseKws().length,
          mode,
          location,
          language,
          resultsCount: data.results.length,
          results: data.results,
        };
        setHistory((prev) => {
          const updated = [newItem, ...prev.filter((h) => h.keywords !== newItem.keywords)].slice(0, 50);
          try {
            localStorage.setItem("kp_history", JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
    } catch (err) {
      showToast(`查询失败: ${err instanceof Error ? err.message : err}`, true);
    } finally {
      setLoading(false);
    }
  }, [kwCount, parseKws, mode, location, language, maxIdeas, showToast]);

  // ── 历史记录操作 ──────────────────────────────────────
  const handleSelectHistory = useCallback((item: QueryHistoryItem) => {
    setKeywords(item.keywords.replace(/, /g, "\n"));
    setMode(item.mode);
    setLocation(item.location);
    setLanguage(item.language);
    setResults(item.results);
    setHasQueried(true);
    setSortKey(null);
    showToast("✓ 已恢复历史查询结果（未消耗 API 额度）");
  }, [showToast]);

  const handleRerunHistory = useCallback((item: QueryHistoryItem) => {
    setKeywords(item.keywords.replace(/, /g, "\n"));
    setMode(item.mode);
    setLocation(item.location);
    setLanguage(item.language);
    // 延迟一拍触发，确保 state 已就绪
    setTimeout(() => {
      const btn = document.getElementById("btn-start-query");
      if (btn) btn.click();
    }, 100);
  }, []);

  const handleDeleteHistory = useCallback((id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((h) => h.id !== id);
      try {
        localStorage.setItem("kp_history", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const handleClearAllHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem("kp_history");
    } catch {}
    showToast("✓ 历史记录已清空");
  }, [showToast]);

  // ── 排序 ──────────────────────────────────────────────
  const handleSort = useCallback(
    (key: SortKey) => {
      const asc = sortKey === key ? !sortAsc : key === "keyword";
      setSortKey(key);
      setSortAsc(asc);
      setResults((prev) =>
        [...prev].sort((a, b) => {
          const va = a[key];
          const vb = b[key];
          if (typeof va === "string" && typeof vb === "string") {
            return asc ? va.localeCompare(vb) : vb.localeCompare(va);
          }
          return asc ? (va as number) - (vb as number) : (vb as number) - (va as number);
        })
      );
    },
    [sortKey, sortAsc]
  );

  // ── 导出 CSV ──────────────────────────────────────────
  const exportCSV = useCallback(() => {
    if (!results.length) return;
    const header = "Keyword,Monthly Searches,Competition,Competition Index,Low CPC,High CPC";
    const rows = results.map(
      (r) =>
        `"${r.keyword}",${r.avgMonthlySearches},${r.competition},${r.competitionIndex},${r.lowBid.toFixed(2)},${r.highBid.toFixed(2)}`
    );
    const csv = "\uFEFF" + header + "\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "keyword_metrics.csv";
    a.click();
    URL.revokeObjectURL(url);
    showToast("✓ 已导出 CSV");
  }, [results, showToast]);

  // ── 复制表格 ──────────────────────────────────────────
  const copyTable = useCallback(async () => {
    if (!results.length) return;
    const header = "Keyword\tMonthly Searches\tCompetition\tIndex\tLow CPC\tHigh CPC";
    const rows = results.map(
      (r) =>
        `${r.keyword}\t${r.avgMonthlySearches}\t${r.competition}\t${r.competitionIndex}\t$${r.lowBid.toFixed(2)}\t$${r.highBid.toFixed(2)}`
    );
    await navigator.clipboard.writeText(header + "\n" + rows.join("\n"));
    showToast("✓ 已复制到剪贴板，可直接粘贴到 Excel");
  }, [results, showToast]);

  // ── 快捷键 ────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        doQuery();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [doQuery]);

  // ── 排序箭头 ──────────────────────────────────────────
  function SortArrow({ col }: { col: SortKey }) {
    const active = sortKey === col;
    return (
      <span className={`sort-arrow ml-1 text-[10px] ${active ? "text-indigo-600 dark:text-indigo-400 opacity-100" : "opacity-30"}`}>
        {active ? (sortAsc ? "↑" : "↓") : "↕"}
      </span>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0f] text-slate-900 dark:text-zinc-100 transition-colors">
      <div className="max-w-[1260px] mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-24">
        
        {/* ── 顶部导航栏 (移动端自适应) ───────────────────────── */}
        <div className="flex items-center justify-between gap-3 mb-6 sm:mb-8 pb-3 border-b border-slate-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔍</span>
            <span className="font-bold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white">
              Keyword Planner
            </span>
            <span className="hidden sm:inline-block px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10 rounded-full">
              Basic 15,000次/天
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* 历史记录按钮 */}
            <button
              onClick={() => setIsHistoryOpen(true)}
              type="button"
              className="p-2 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#1a1a26] text-slate-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-medium shadow-sm transition-all inline-flex items-center gap-1.5"
              title="查看查询历史记录"
            >
              <span>🕒</span>
              <span className="hidden sm:inline">历史</span>
              {history.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 tabular-nums">
                  {history.length}
                </span>
              )}
            </button>

            {/* 明暗模式切换 */}
            <button
              onClick={toggleTheme}
              type="button"
              className="p-2 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#1a1a26] text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium shadow-sm transition-all inline-flex items-center gap-1.5"
              title={theme === "dark" ? "切换为明亮模式" : "切换为暗黑模式"}
            >
              <span>{theme === "dark" ? "☀️" : "🌙"}</span>
              <span className="hidden sm:inline">{theme === "dark" ? "明亮" : "暗黑"}</span>
            </button>

            {/* 退出登录按钮 */}
            <button
              onClick={handleLogout}
              type="button"
              title="退出登录"
              className="p-2 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#1a1a26] text-slate-600 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 text-xs font-medium shadow-sm transition-all inline-flex items-center gap-1.5"
            >
              <span>🔒</span>
              <span className="hidden sm:inline">退出</span>
            </button>
          </div>
        </div>

        {/* ── Query Card ──────────────────────────────────── */}
        <div className="bg-white dark:bg-[#12121a] border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-sm dark:shadow-2xl dark:shadow-black/40 mb-5 sm:mb-6 transition-colors">
          
          {/* Mode Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
            {(["historical", "ideas"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 rounded-xl sm:rounded-full text-xs sm:text-[13px] font-semibold border transition-all text-center
                  ${mode === m
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "bg-slate-50 dark:bg-transparent border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-500"
                  }`}
              >
                {m === "historical" ? "📊 精确查询" : "💡 拓展关键词"}
              </button>
            ))}
          </div>

          {/* Keyword Input */}
          <textarea
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder={`输入关键词，每行一个或逗号分隔\n\n例如:\nseo tools\nkeyword research\ngoogle ads`}
            className="w-full min-h-[110px] sm:min-h-[130px] px-3.5 py-3 rounded-xl bg-slate-50 dark:bg-[#1a1a26] border border-slate-200 dark:border-zinc-800
                       text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 text-sm resize-y outline-none
                       focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />

          {/* 最近查询快捷标签 */}
          {history.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] text-slate-400 dark:text-zinc-500 shrink-0 font-medium">🕒 最近:</span>
              {history.slice(0, 5).map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => handleSelectHistory(h)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-indigo-50 dark:bg-zinc-800/80 dark:hover:bg-indigo-950/40 text-slate-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-[11px] border border-slate-200/80 dark:border-zinc-700/60 transition-all shrink-0 max-w-[140px] sm:max-w-[180px] truncate"
                  title={`点击直接查看结果: ${h.keywords}`}
                >
                  {h.keywords}
                </button>
              ))}
            </div>
          )}

          {/* Settings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-3 sm:mt-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                目标地区
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-[#1a1a26] border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 text-sm
                           outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20
                           appearance-none cursor-pointer transition-all
                           bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2212%22%20height%3D%2212%22%20fill%3D%22%236b7280%22%3E%3Cpath%20d%3D%22M6%208.5L1%203.5h10z%22/%3E%3C/svg%3E')]
                           bg-no-repeat bg-[right_12px_center]"
              >
                {Object.entries(GEO_LOCATIONS).map(([code, { label }]) => (
                  <option key={code} value={code}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                语言
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-[#1a1a26] border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 text-sm
                           outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20
                           appearance-none cursor-pointer transition-all
                           bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2212%22%20height%3D%2212%22%20fill%3D%22%236b7280%22%3E%3Cpath%20d%3D%22M6%208.5L1%203.5h10z%22/%3E%3C/svg%3E')]
                           bg-no-repeat bg-[right_12px_center]"
              >
                {Object.entries(LANGUAGES).map(([code, { label }]) => (
                  <option key={code} value={code}>{label}</option>
                ))}
              </select>
            </div>

            {mode === "ideas" && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  最大拓展数
                </label>
                <input
                  type="number"
                  value={maxIdeas}
                  onChange={(e) => setMaxIdeas(Math.max(1, parseInt(e.target.value) || 50))}
                  min={1}
                  max={500}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#1a1a26] border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 text-sm
                             outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4 sm:mt-5">
            <button
              id="btn-start-query"
              onClick={doQuery}
              disabled={loading || !kwCount}
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold
                         hover:bg-indigo-500 active:scale-[0.98] transition-all
                         disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
                         shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  查询中...
                </>
              ) : (
                <>🚀 开始查询</>
              )}
            </button>

            <button
              onClick={() => {
                setKeywords("");
                setResults([]);
                setHasQueried(false);
              }}
              className="px-4 py-2.5 sm:py-3 rounded-xl bg-slate-100 dark:bg-[#1a1a26] border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 text-xs sm:text-sm font-semibold
                         hover:border-slate-300 dark:hover:border-zinc-700 hover:text-slate-900 dark:hover:text-zinc-200 transition-all text-center"
            >
              🗑️ 清空
            </button>

            <span className="sm:ml-auto text-center sm:text-right text-xs text-slate-400 dark:text-zinc-500">
              {kwCount} 个关键词{kwCount > 0 && " (⌘+Enter 快捷查询)"}
            </span>
          </div>
        </div>

        {/* ── Results ─────────────────────────────────────── */}
        {hasQueried && results.length > 0 && (
          <div className="bg-white dark:bg-[#12121a] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm dark:shadow-2xl dark:shadow-black/40 animate-fade-in overflow-hidden transition-colors">
            
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-3 border-b border-slate-100 dark:border-zinc-800/80">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  查询结果
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5">
                  共 {results.length} 个关键词 · {mode === "ideas" ? "拓展模式" : "精确查询模式"}
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                {/* 视图切换 (移动端极其实用) */}
                <div className="flex items-center bg-slate-100 dark:bg-[#1a1a26] p-1 rounded-lg border border-slate-200 dark:border-zinc-800">
                  <button
                    onClick={() => setViewMode("table")}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                      viewMode === "table"
                        ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "text-slate-500 dark:text-zinc-400"
                    }`}
                  >
                    📋 表格
                  </button>
                  <button
                    onClick={() => setViewMode("card")}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                      viewMode === "card"
                        ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "text-slate-500 dark:text-zinc-400"
                    }`}
                  >
                    🗂️ 卡片
                  </button>
                </div>

                <button
                  onClick={exportCSV}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#1a1a26] border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold
                             hover:border-slate-300 dark:hover:border-zinc-700 transition-all inline-flex items-center gap-1"
                >
                  📄 CSV
                </button>
                <button
                  onClick={copyTable}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#1a1a26] border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold
                             hover:border-slate-300 dark:hover:border-zinc-700 transition-all inline-flex items-center gap-1"
                >
                  📋 复制
                </button>
              </div>
            </div>

            {/* 1. 表格视图 (带首列粘性固定，横向滑动极佳) */}
            {viewMode === "table" ? (
              <div className="overflow-x-auto relative">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#161622]">
                      {[
                        { key: "keyword" as SortKey, label: "关键词", sticky: true },
                        { key: "avgMonthlySearches" as SortKey, label: "月均搜索量" },
                        { key: null, label: "趋势" },
                        { key: "competition" as SortKey, label: "竞争度" },
                        { key: "competitionIndex" as SortKey, label: "指数" },
                        { key: "lowBid" as SortKey, label: "最低 CPC" },
                        { key: "highBid" as SortKey, label: "最高 CPC" },
                      ].map(({ key, label, sticky }, i) => (
                        <th
                          key={i}
                          onClick={key ? () => handleSort(key) : undefined}
                          className={`px-3.5 py-3 text-left text-[11px] font-bold uppercase tracking-wider
                            text-slate-500 dark:text-zinc-400 whitespace-nowrap select-none
                            ${key ? "cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" : ""}
                            ${sticky ? "sticky left-0 bg-slate-50 dark:bg-[#161622] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.4)]" : ""}
                          `}
                        >
                          {label}
                          {key && <SortArrow col={key} />}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr
                        key={i}
                        className="border-b border-slate-100 dark:border-zinc-800/60 hover:bg-slate-50 dark:hover:bg-[#1a1a26] transition-colors"
                      >
                        <td className="sticky left-0 bg-white dark:bg-[#12121a] px-3.5 py-3 font-medium text-slate-900 dark:text-white max-w-[200px] sm:max-w-[280px] break-words z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.4)]">
                          {r.keyword}
                        </td>
                        <td className="px-3.5 py-3 text-right font-semibold tabular-nums text-indigo-600 dark:text-indigo-400">
                          {r.avgMonthlySearches.toLocaleString()}
                        </td>
                        <td className="px-3 py-2">
                          <Sparkline data={r.monthlyTrend} />
                        </td>
                        <td className="px-3.5 py-3">
                          <CompBadge level={r.competition} />
                        </td>
                        <td className="px-3.5 py-3 text-right tabular-nums text-slate-500 dark:text-zinc-400">
                          {r.competitionIndex}
                        </td>
                        <td className="px-3.5 py-3 text-right tabular-nums text-slate-700 dark:text-zinc-300">
                          ${r.lowBid.toFixed(2)}
                        </td>
                        <td className="px-3.5 py-3 text-right tabular-nums text-slate-700 dark:text-zinc-300">
                          ${r.highBid.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* 2. 移动端卡片视图 (手机端体验极佳) */
              <div className="p-3 sm:p-4 grid grid-cols-1 gap-3">
                {results.map((r, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-[#161622] space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white text-sm break-words">
                        {r.keyword}
                      </span>
                      <CompBadge level={r.competition} />
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-zinc-800/80">
                      <div>
                        <span className="text-slate-400 dark:text-zinc-500 block text-[10px] uppercase">
                          月均搜索量
                        </span>
                        <span className="text-base font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                          {r.avgMonthlySearches.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 dark:text-zinc-500 block text-[10px] uppercase">
                          竞价区间 (CPC)
                        </span>
                        <span className="font-semibold text-slate-700 dark:text-zinc-300 tabular-nums">
                          ${r.lowBid.toFixed(2)} ~ ${r.highBid.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 dark:text-zinc-400">
                      <span>竞争指数: <strong className="text-slate-700 dark:text-zinc-300">{r.competitionIndex}</strong></span>
                      <Sparkline data={r.monthlyTrend} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!hasQueried && (
          <div className="text-center py-12 sm:py-16 text-slate-400 dark:text-zinc-600">
            <div className="text-4xl sm:text-5xl mb-3">🔎</div>
            <p className="text-xs sm:text-sm">输入关键词并点击查询，获取 Google 官方精确搜索量数据</p>
          </div>
        )}

        {hasQueried && results.length === 0 && !loading && (
          <div className="text-center py-12 sm:py-16 text-slate-400 dark:text-zinc-600">
            <div className="text-4xl sm:text-5xl mb-3">😶</div>
            <p className="text-xs sm:text-sm">未查询到任何数据，请检查关键词或更换地区/语言</p>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#12121a] border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 text-center shadow-2xl">
              <div className="w-10 h-10 border-3 border-slate-200 dark:border-zinc-700 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-medium">
                正在调用 Google Ads API...
              </p>
            </div>
          </div>
        )}

        {/* History Drawer */}
        <HistoryDrawer
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          history={history}
          onSelect={handleSelectHistory}
          onRerun={handleRerunHistory}
          onDelete={handleDeleteHistory}
          onClearAll={handleClearAllHistory}
        />

        {/* Toast */}
        <Toast msg={toast.msg} isError={toast.isError} />
      </div>
    </div>
  );
}
