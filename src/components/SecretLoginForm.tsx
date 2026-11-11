"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function SecretLoginForm({ secretPath }: { secretPath: string }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!password) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        setError("密码错误");
      }
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a0f]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔐</div>
          <h1 className="text-xl font-bold text-white tracking-tight">Keyword Planner</h1>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wider font-semibold">
            Private Access Gate
          </p>
        </div>

        <div className="bg-[#12121a] border border-zinc-800 rounded-2xl p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                访问密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入访问密钥"
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-[#1a1a26] border border-zinc-800
                           text-white text-sm placeholder:text-zinc-600 outline-none
                           focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20
                           transition-all"
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
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
