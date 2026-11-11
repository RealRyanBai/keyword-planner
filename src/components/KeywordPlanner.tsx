"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { GEO_LOCATIONS, LANGUAGES, type KeywordResult } from "@/lib/constants";

// ════════════════════════════════════════════════════════════
//  Sparkline 迷你趋势图
// ════════════════════════════════════════════════════════════

function Sparkline({ data }: { data: KeywordResult["monthlyTrend"] }) {
  if (!data?.length) return <span className="text-zinc-600">—</span>;

  const w = 110, h = 30, pad = 2;
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
    <svg viewBox={`0 0 ${w} ${h}`} className="w-[110px] h-[30px]">
      <polygon points={area} className="fill-indigo-500/15" />
      <polyline
        points={pts}
        fill="none"
        className="stroke-indigo-400"
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
  LOW:         "bg-emerald-500/15 text-emerald-400",
  MEDIUM:      "bg-amber-500/15 text-amber-400",
  HIGH:        "bg-red-500/15 text-red-400",
  UNSPECIFIED: "bg-zinc-700/40 text-zinc-500",
};

function CompBadge({ level }: { level: string }) {
  const cls = compStyles[level] || compStyles.UNSPECIFIED;
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide ${cls}`}>
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
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-3
        rounded-xl text-sm font-medium shadow-2xl animate-slide-up
        ${isError
          ? "bg-red-950/90 border border-red-800 text-red-300"
          : "bg-surface-3 border border-zinc-700 text-zinc-200"
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
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ── Toast 辅助 ────────────────────────────────────────
  const showToast = useCallback((msg: string, isError = false) => {
    setToast({ msg, isError });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast({ msg: "", isError: false }), 3000);
  }, []);

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
    } catch (err) {
      showToast(`查询失败: ${err instanceof Error ? err.message : err}`, true);
    } finally {
      setLoading(false);
    }
  }, [kwCount, parseKws, mode, location, language, maxIdeas, showToast]);

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
            return asc
              ? va.localeCompare(vb)
              : vb.localeCompare(va);
          }
          return asc
            ? (va as number) - (vb as number)
            : (vb as number) - (va as number);
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
      (r) => `"${r.keyword}",${r.avgMonthlySearches},${r.competition},${r.competitionIndex},${r.lowBid.toFixed(2)},${r.highBid.toFixed(2)}`
    );
    const csv = "\uFEFF" + header + "\n" + rows.join("\n"); // BOM for Excel
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

  // ── Cmd/Ctrl + Enter 快捷键 ───────────────────────────
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
      <span className={`sort-arrow ml-1 text-[10px] ${active ? "text-indigo-400 opacity-100" : "opacity-30"}`}>
        {active ? (sortAsc ? "↑" : "↓") : "↕"}
      </span>
    );
  }

  // ── 锁定并退出 ─────────────────────────────────────────
  const handleLock = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    window.location.reload();
  };

  // ════════════════════════════════════════════════════════
  //  JSX
  // ════════════════════════════════════════════════════════

  return (
    <div className="max-w-[1260px] mx-auto px-5 py-8 pb-24">
      {/* ── Header ──────────────────────────────────────── */}
      <header className="relative text-center mb-10">
        <button
          onClick={handleLock}
          title="退出登录"
          className="absolute right-0 top-0 px-3 py-1.5 rounded-lg border border-zinc-800 bg-surface-2 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 text-xs font-medium transition-all inline-flex items-center gap-1.5"
        >
          🔒 <span>退出登录</span>
        </button>
        <h1 className="text-[28px] font-bold tracking-tight bg-gradient-to-r from-zinc-100 via-zinc-200 to-indigo-400 bg-clip-text text-transparent">
          🔍 Keyword Planner
        </h1>
        <p className="text-zinc-500 text-sm mt-1.5">
          Google Ads API 官方精确搜索量 · 竞争度 · CPC 出价 · 趋势
        </p>
        <span className="inline-block mt-2.5 px-3 py-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 rounded-full tracking-wide">
          ✓ Basic Access · 每日 15,000 次
        </span>
      </header>

      {/* ── Query Card ──────────────────────────────────── */}
      <div className="bg-surface border border-zinc-800 rounded-2xl p-6 shadow-2xl shadow-black/30 mb-6">
        {/* Mode Toggle */}
        <div className="flex items-center gap-3 mb-5">
          {(["historical", "ideas"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-5 py-2 rounded-full text-[13px] font-semibold border transition-all
                ${mode === m
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300"
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
          className="w-full min-h-[130px] px-4 py-3.5 rounded-xl bg-surface-2 border border-zinc-800
                     text-zinc-100 placeholder:text-zinc-600 text-sm resize-y outline-none
                     focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
        />

        {/* Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
              目标地区
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-surface-2 border border-zinc-800 text-zinc-200 text-sm
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
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
              语言
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-surface-2 border border-zinc-800 text-zinc-200 text-sm
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
              <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                最大拓展数
              </label>
              <input
                type="number"
                value={maxIdeas}
                onChange={(e) => setMaxIdeas(Math.max(1, parseInt(e.target.value) || 50))}
                min={1}
                max={500}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-2 border border-zinc-800 text-zinc-200 text-sm
                           outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-3 mt-5 flex-wrap">
          <button
            onClick={doQuery}
            disabled={loading || !kwCount}
            className="px-7 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold
                       hover:bg-indigo-500 active:scale-[0.97] transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
                       shadow-lg shadow-indigo-600/20 inline-flex items-center gap-2"
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
            className="px-4 py-3 rounded-xl bg-surface-2 border border-zinc-800 text-zinc-400 text-sm font-semibold
                       hover:border-zinc-600 hover:text-zinc-300 transition-all"
          >
            🗑️ 清空
          </button>

          <span className="ml-auto text-xs text-zinc-600">
            {kwCount} 个关键词{kwCount > 0 && "  ⌘+Enter 快速查询"}
          </span>
        </div>
      </div>

      {/* ── Results ─────────────────────────────────────── */}
      {hasQueried && results.length > 0 && (
        <div className="bg-surface border border-zinc-800 rounded-2xl shadow-2xl shadow-black/30 animate-fade-in">
          {/* Results Header */}
          <div className="flex items-center justify-between p-5 pb-0 flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">查询结果</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                共 {results.length} 个关键词 ·{" "}
                {mode === "ideas" ? "拓展模式" : "精确查询模式"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportCSV}
                className="px-3.5 py-2 rounded-lg bg-surface-2 border border-zinc-800 text-zinc-400 text-xs font-semibold
                           hover:border-zinc-600 hover:text-zinc-300 transition-all inline-flex items-center gap-1.5"
              >
                📄 CSV
              </button>
              <button
                onClick={copyTable}
                className="px-3.5 py-2 rounded-lg bg-surface-2 border border-zinc-800 text-zinc-400 text-xs font-semibold
                           hover:border-zinc-600 hover:text-zinc-300 transition-all inline-flex items-center gap-1.5"
              >
                📋 复制
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  {[
                    { key: "keyword" as SortKey, label: "关键词" },
                    { key: "avgMonthlySearches" as SortKey, label: "月均搜索量" },
                    { key: null, label: "趋势" },
                    { key: "competition" as SortKey, label: "竞争度" },
                    { key: "competitionIndex" as SortKey, label: "指数" },
                    { key: "lowBid" as SortKey, label: "最低 CPC" },
                    { key: "highBid" as SortKey, label: "最高 CPC" },
                  ].map(({ key, label }, i) => (
                    <th
                      key={i}
                      onClick={key ? () => handleSort(key) : undefined}
                      className={`px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider
                        text-zinc-500 bg-surface-2 whitespace-nowrap select-none
                        ${key ? "cursor-pointer hover:text-zinc-300 transition-colors" : ""}
                        ${i === 0 ? "rounded-tl-none" : ""}
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
                    className="border-b border-zinc-800/60 hover:bg-surface-2 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-white max-w-[280px] break-words">
                      {r.keyword}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-zinc-200">
                      {r.avgMonthlySearches.toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      <Sparkline data={r.monthlyTrend} />
                    </td>
                    <td className="px-4 py-3">
                      <CompBadge level={r.competition} />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-zinc-400">
                      {r.competitionIndex}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-zinc-300">
                      ${r.lowBid.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-zinc-300">
                      ${r.highBid.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!hasQueried && (
        <div className="text-center py-16 text-zinc-600">
          <div className="text-5xl mb-4">🔎</div>
          <p className="text-sm">输入关键词并点击查询，获取 Google 官方精确搜索量数据</p>
        </div>
      )}

      {hasQueried && results.length === 0 && !loading && (
        <div className="text-center py-16 text-zinc-600">
          <div className="text-5xl mb-4">😶</div>
          <p className="text-sm">未查询到任何数据，请检查关键词或更换地区/语言</p>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-zinc-700 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-zinc-400">正在调用 Google Ads API...</p>
          </div>
        </div>
      )}

      {/* Toast */}
      <Toast msg={toast.msg} isError={toast.isError} />
    </div>
  );
}
