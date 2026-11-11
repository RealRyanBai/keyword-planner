"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/useTheme";

export default function SecretLoginForm({ secretPath }: { secretPath: string }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "用户名或密码错误");
      }
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[#0a0a0f] transition-colors">
      {/* 顶部主题切换按钮 */}
      <div className="fixed top-4 right-4">
        <button
          onClick={toggleTheme}
          type="button"
          className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#12121a] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white shadow-sm transition-all"
          title={theme === "dark" ? "切换为明亮模式" : "切换为暗黑模式"}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </div>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔐</div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Keyword Planner
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1 uppercase tracking-wider font-semibold">
            Private Access Gate
          </p>
        </div>

        <div className="bg-white dark:bg-[#12121a] border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-xl shadow-slate-200/50 dark:shadow-black/40 transition-colors">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="输入用户名"
                autoFocus
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-[#1a1a26] border border-slate-200 dark:border-zinc-800
                           text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-zinc-600 outline-none
                           focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20
                           transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                访问密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入访问密钥"
                className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-[#1a1a26] border border-slate-200 dark:border-zinc-800
                           text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-zinc-600 outline-none
                           focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20
                           transition-all"
              />
            </div>

            {error && (
              <p className="text-red-500 dark:text-red-400 text-xs text-center font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !username.trim() || !password}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold
                         hover:bg-indigo-500 active:scale-[0.98] transition-all
                         disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20"
            >
              {loading ? "验证中..." : "进入系统"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
