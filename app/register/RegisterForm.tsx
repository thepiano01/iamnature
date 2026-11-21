"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HEALTH, type HealthCode } from "@/lib/health";
import { cx } from "@/lib/format";

export default function RegisterForm({ initialRole, next }: { initialRole: "BUYER" | "SELLER"; next: string | null }) {
  const router = useRouter();
  const [role, setRole] = useState(initialRole);
  const [health, setHealth] = useState<HealthCode[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setErr(null);
        if (fd.get("password") !== fd.get("password2")) return setErr("비밀번호가 서로 다릅니다.");
        start(async () => {
          const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...Object.fromEntries(fd), role, health }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.ok) return setErr(data.error || "가입에 실패했습니다.");
          router.push(role === "SELLER" ? "/sell/verify" : next || (health.length ? "/match" : "/"));
          router.refresh();
        });
      }}
    >
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-hanji-100 p-1.5">
        {(
          [
            ["BUYER", "구매자", "자연산을 사고 싶어요"],
            ["SELLER", "채취자", "직접 캐서 팔고 싶어요"],
          ] as const
        ).map(([r, t, d]) => (
          <button key={r} type="button" onClick={() => setRole(r)} className={cx("rounded-xl px-3 py-3 text-left transition", role === r ? "bg-white shadow-sm" : "hover:bg-white/50")}>
            <span className={cx("block text-sm font-bold", role === r ? "text-forest-900" : "text-bark-500")}>{t}</span>
            <span className="block text-[11px] text-bark-400">{d}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        <div>
          <label className="label">이름</label>
          <input name="name" required className="input py-3" placeholder="홍길동" />
        </div>
        <div>
          <label className="label">이메일</label>
          <input name="email" type="email" required autoComplete="email" className="input py-3" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">비밀번호 (8자 이상)</label>
            <input name="password" type="password" minLength={8} required autoComplete="new-password" className="input py-3" />
          </div>
          <div>
            <label className="label">비밀번호 확인</label>
            <input name="password2" type="password" minLength={8} required autoComplete="new-password" className="input py-3" />
          </div>
        </div>
      </div>

      {role === "SELLER" ? (
        <div className="grid gap-4 rounded-2xl border border-hanji-200 bg-white p-4">
          <div>
            <label className="label">채취자·농장 이름 (상품에 표시돼요)</label>
            <input name="farmName" className="input" placeholder="예: 태백 산마루 채취단" />
          </div>
          <div>
            <label className="label">사업자등록번호 (선택)</label>
            <input name="businessNumber" className="input" placeholder="000-00-00000" />
          </div>
          <p className="text-xs text-bark-500">가입 후 신분증·영업신고증을 올리면 ‘인증 채취자’ 배지가 붙어요.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-hanji-200 bg-white p-4">
          <p className="label">건강상태 (선택 · 맞춤 추천에 사용)</p>
          <div className="flex flex-wrap gap-1.5">
            {HEALTH.map((h) => {
              const on = health.includes(h.code);
              return (
                <button key={h.code} type="button" onClick={() => setHealth((p) => (on ? p.filter((x) => x !== h.code) : [...p, h.code]))} className={cx("chip", on ? "border-clay-500 bg-clay-500 text-white" : "border-hanji-300 text-bark-700 hover:border-clay-500")}>
                  {h.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {err && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>}
      <button className="btn-primary w-full py-3.5" disabled={pending}>{pending ? "가입 중…" : role === "SELLER" ? "채취자로 가입하기" : "가입하기"}</button>
    </form>
  );
}
