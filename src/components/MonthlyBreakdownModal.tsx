"use client";

import { useEffect } from "react";
import { formatMonthCN, type KeywordResult } from "@/lib/constants";

interface Props {
  keywordData: KeywordResult | null;
  onClose: () => void;
}

export default function MonthlyBreakdownModal({ keywordData, onClose }: Props) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!keywordData) return null;

  const trend = keywordData.monthlyTrend || [];
  const vals = trend.map((t) => t.searches);
  const maxSearch = Math.max(...vals, 1);
  const minSearch = Math.min(...vals);

  // 倒序排列（最近月份排在最前）
  const reversedTrend = [...trend].reverse();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      {/* 遮罩 */}
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div
        className="relative z-10 w-full max-w-xl max-h-[85vh] bg-white dark:bg-[#12121a] border border-slate-200 dark:border-zinc-800
                   rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 弹窗头部 */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800/80 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 font-bold">
                月度明细
              </span>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white break-words">
                {keywordData.keyword}
              </h3>
            </div>
            {keywordData.dateRangeStr && (
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                📅 统计周期: {keywordData.dateRangeStr}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all text-sm font-bold shrink-0"
          >
            ✕
          </button>
        </div>

        {/* 核心指标概览 */}
        <div className="grid grid-cols-3 gap-2 p-3 sm:p-4 bg-slate-50/70 dark:bg-[#161622] border-b border-slate-100 dark:border-zinc-800/80 text-center">
          <div className="p-2 rounded-lg bg-white dark:bg-[#1a1a26] border border-slate-200/60 dark:border-zinc-800">
            <span className="text-[10px] uppercase text-slate-400 dark:text-zinc-500 block font-semibold">
              期间月均
            </span>
            <span className="text-sm sm:text-base font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
              {keywordData.avgMonthlySearches.toLocaleString()}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-white dark:bg-[#1a1a26] border border-slate-200/60 dark:border-zinc-800">
            <span className="text-[10px] uppercase text-slate-400 dark:text-zinc-500 block font-semibold">
              最高月份
            </span>
            <span className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {maxSearch.toLocaleString()}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-white dark:bg-[#1a1a26] border border-slate-200/60 dark:border-zinc-800">
            <span className="text-[10px] uppercase text-slate-400 dark:text-zinc-500 block font-semibold">
              最低月份
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-600 dark:text-zinc-300 tabular-nums">
              {minSearch.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 月度柱状明细列表 */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-2.5">
          <p className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
            逐月精确搜索量走势（最新月份在前）:
          </p>

          {reversedTrend.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-zinc-500 text-xs">
              暂无逐月细分数据
            </div>
          ) : (
            reversedTrend.map((m, idx) => {
              const percent = Math.max(4, Math.round((m.searches / maxSearch) * 100));
              const isPeak = m.searches === maxSearch && maxSearch > 0;

              return (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-[#1a1a26] transition-colors"
                >
                  <span className="w-20 text-xs font-semibold text-slate-600 dark:text-zinc-400 tabular-nums shrink-0">
                    {m.year}年 {formatMonthCN(m.month)}
                  </span>

                  {/* 进度柱状图 */}
                  <div className="flex-1 bg-slate-100 dark:bg-zinc-800/80 h-4 rounded-full overflow-hidden flex items-center px-1">
                    <div
                      className={`h-2.5 rounded-full transition-all ${
                        isPeak
                          ? "bg-gradient-to-r from-emerald-500 to-indigo-600"
                          : "bg-indigo-500/80 dark:bg-indigo-500"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <span
                    className={`w-20 text-right text-xs font-bold tabular-nums shrink-0 ${
                      isPeak
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-slate-800 dark:text-zinc-200"
                    }`}
                  >
                    {m.searches.toLocaleString()}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* 弹窗底部 */}
        <div className="p-3 border-t border-slate-100 dark:border-zinc-800/80 text-center text-[11px] text-slate-400 dark:text-zinc-500 bg-slate-50/50 dark:bg-[#161622]">
          数据直接来自 Google Ads 官方 Keyword Planner 历史数据库
        </div>
      </div>
    </div>
  );
}
