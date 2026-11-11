"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Decoy404() {
  const [clickCount, setClickCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. 支持通过 URL 参数自动解锁，如 /?unlock=你的密码 或 /?key=你的密码
  useEffect(() => {
    const key = searchParams.get("unlock") || searchParams.get("key") || searchParams.get("secret");
    if (key) {
      handleUnlock(key);
    }
  }, [searchParams]);

  // 2. 支持快捷键呼出：按 3 次 Esc，或 Cmd+Shift+L / Ctrl+Shift+L
  useEffect(() => {
    let escCount = 0;
    let escTimer: ReturnType<typeof setTimeout>;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        setShowModal((prev) => !prev);
      }
      if (e.key === "Escape") {
        escCount++;
        clearTimeout(escTimer);
        if (escCount >= 3) {
          setShowModal(true);
          escCount = 0;
        } else {
          escTimer = setTimeout(() => {
            escCount = 0;
          }, 1000);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 3. 连续点击 "404" 标题 4 次隐形呼出
  const handleTitleClick = () => {
    setClickCount((prev) => {
      const next = prev + 1;
      clearTimeout(timerRef.current);
      if (next >= 4) {
        setShowModal(true);
        return 0;
      }
      timerRef.current = setTimeout(() => {
        setClickCount(0);
      }, 1500);
      return next;
    });
  };

  const handleUnlock = async (pwd: string) => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd }),
      });
      if (res.ok) {
        // 清除 URL 中的参数并刷新，直接展示主程序
        window.location.href = "/";
      } else {
        setError("密码错误");
      }
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!password) return;
    handleUnlock(password);
  };

  return (
    <>
      {/* 假装标准的 Next.js / Vercel 404 页面 */}
      <div className="min-h-screen bg-[#000] text-[#fff] flex flex-col items-center justify-center font-sans select-none">
        <div className="flex items-center text-center">
          <h1
            onClick={handleTitleClick}
            className="text-[24px] font-medium leading-[49px] pr-[23px] mr-[20px] border-r border-white/30 cursor-default hover:text-white transition-colors"
            title=""
          >
            404
          </h1>
          <div className="inline-block text-left">
            <h2 className="text-[14px] font-normal leading-[49px] m-0 text-zinc-400">
              This page could not be found.
            </h2>
          </div>
        </div>
      </div>

      {/* 隐藏式暗门弹窗 */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-xs bg-[#12121a] border border-zinc-800 rounded-2xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-5">
              <div className="text-2xl mb-1">🔐</div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                Access Gate
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入访问密钥"
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-zinc-800
                           text-white text-sm placeholder:text-zinc-600 outline-none
                           focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20
                           transition-all"
              />

              {error && (
                <p className="text-red-400 text-xs text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !password}
                className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold
                           hover:bg-indigo-500 active:scale-[0.98] transition-all
                           disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "验证中..." : "解锁"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
