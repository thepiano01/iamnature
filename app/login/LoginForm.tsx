"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setErr(null);
        start(async () => {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: fd.get("email"), password: fd.get("password") }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.ok) return setErr(data.error || "로그인에 실패했습니다.");
          router.push(next);
          router.refresh();
        });
      }}
    >
      <div>
        <label className="label" htmlFor="email">이메일</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input py-3" placeholder="you@example.com" />
      </div>
      <div>
        <label className="label" htmlFor="password">비밀번호</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input py-3" />
      </div>
      {err && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>}
      <button className="btn-primary w-full py-3.5" disabled={pending}>{pending ? "로그인 중…" : "로그인"}</button>
    </form>
  );
}
