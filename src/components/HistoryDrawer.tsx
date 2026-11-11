"use client";

import { GEO_LOCATIONS, LANGUAGES, type KeywordResult } from "@/lib/constants";

export interface QueryHistoryItem {
  id: string;
  timestamp: number;
  dateStr: string;
  keywords: string;
  keywordCount: number;
  mode: "historical" | "ideas";
  location: string;
  language: string;
  resultsCount: number;
  results: KeywordResult[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  history: QueryHistoryItem[];
  onSelect: (item: QueryHistoryItem) => void;
  onRerun: (item: QueryHistoryItem) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export default function HistoryDrawer({
  isOpen,
  onClose,
  history,
  onSelect,
  onRerun,
  onDelete,
  onClearAll,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* 遮罩背景 */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* 侧边滑出面板 (手机端自适应为底部抽屉) */}
      <div
        className="relative z-10 w-full sm:w-[460px] h-[90vh] sm:h-full mt-auto sm:mt-0
                   bg-white dark:bg-[#12121a] border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-zinc-800
                   rounded-t-2xl sm:rounded-none shadow-2xl flex flex-col transition-colors animate-slide-up sm:animate-fade-in"
      >
        {/* Drawer 头部 */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🕒</span>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              查询历史记录
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#1a1a26] text-slate-500 dark:text-zinc-400 font-semibold">
              {history.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={() => {
                  if (confirm("确定要清空全部查询历史吗？")) {
                    onClearAll();
                  }
                }}
                className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 px-2 py-1 rounded transition-colors"
              >
                清空全部
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all text-sm font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Drawer 列表内容 */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-16 text-slate-400 dark:text-zinc-600">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-xs sm:text-sm">暂无查询历史记录</p>
              <p className="text-[11px] mt-1 text-slate-400 dark:text-zinc-600">
                完成关键词查询后，记录会自动保存在这里
              </p>
            </div>
          ) : (
            history.map((item) => {
              const geoLabel = GEO_LOCATIONS[item.location]?.label || item.location;
              const langLabel = LANGUAGES[item.language]?.label || item.language;

              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-[#161622] hover:border-indigo-300 dark:hover:border-zinc-700 transition-all space-y-2.5"
                >
                  {/* 第一行：时间与标签 */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          item.mode === "historical"
                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400"
                            : "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400"
                        }`}
                      >
                        {item.mode === "historical" ? "📊 精确" : "💡 拓展"}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400 px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-zinc-800">
                        {geoLabel}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 dark:text-zinc-500 tabular-nums">
                      {item.dateStr}
                    </span>
                  </div>

                  {/* 第二行：关键词摘要 */}
                  <div className="text-xs font-medium text-slate-900 dark:text-white line-clamp-2 break-words">
                    {item.keywords}
                  </div>

                  {/* 第三行：结果统计与快捷操作 */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 dark:border-zinc-800/80 text-xs">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold tabular-nums">
                      {item.resultsCount} 个结果
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          onSelect(item);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition-all shadow-sm"
                        title="立即恢复上次查询结果（不耗费 API 次数）"
                      >
                        查看结果
                      </button>

                      <button
                        onClick={() => {
                          onRerun(item);
                          onClose();
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-200/80 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-medium transition-all"
                        title="加载此关键词并重新发起 API 查询"
                      >
                        重新查询
                      </button>

                      <button
                        onClick={() => onDelete(item.id)}
                        className="p-1 rounded text-slate-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 text-xs transition-colors"
                        title="删除此条记录"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 底部提示 */}
        <div className="p-3 border-t border-slate-100 dark:border-zinc-800/80 text-center text-[11px] text-slate-400 dark:text-zinc-500">
          点击“查看结果”可秒级复现数据，无需消耗 Google Ads API 每日配额
        </div>
      </div>
    </div>
  );
}
