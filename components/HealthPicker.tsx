"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HEALTH, type HealthCode } from "@/lib/health";
import { cx } from "@/lib/format";

export default function HealthPicker({
  initial = [],
  loggedIn,
  submitLabel,
  redirectTo = "/match",
  compact = false,
}: {
  initial?: HealthCode[];
  loggedIn: boolean;
  submitLabel?: string;
  redirectTo?: string | null;
  compact?: boolean;
  tone?: string;
}) {
  const router = useRouter();
  const [sel, setSel] = useState<HealthCode[]>(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const toggle = (c: HealthCode) => {
    setMsg(null);
    setSel((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));
  };

  const submit = () =>
    start(async () => {
      if (loggedIn) {
        const res = await fetch("/api/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ health: sel }) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) return setMsg(data.error || "저장하지 못했습니다.");
        setMsg("저장했어요 ✓");
        if (redirectTo) router.push(redirectTo);
        router.refresh();
      } else {
        router.push(`/match${sel.length ? `?c=${sel.join(",")}` : ""}`);
      }
    });

  return (
    <div className="space-y-4">
      <div className={cx("grid gap-2", compact ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6")}>
        {HEALTH.map((h) => {
          const on = sel.includes(h.code);
          return (
            <button
              key={h.code}
              type="button"
              onClick={() => toggle(h.code)}
              aria-pressed={on}
              title={h.desc}
              className={cx(
                "relative flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-[13px] font-bold transition active:scale-95",
                on ? "bg-forest-800 text-white shadow-[0_8px_20px_-10px_rgb(15_118_110/0.9)]" : "bg-white text-bark-700 ring-1 ring-hanji-200 hover:ring-forest-600",
              )}
            >
              <span className="text-xl leading-none">{h.emoji}</span>
              {h.label}
              {on && <span className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-white text-[9px] text-forest-800">✓</span>}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={submit} disabled={pending} className="btn-primary flex-1 sm:flex-none">
          {pending ? "처리 중…" : submitLabel ?? (loggedIn ? "저장하고 맞춤 상품 보기" : "맞춤 상품 보기")}
        </button>
        <span className="text-xs font-medium text-bark-500">
          {msg ?? (sel.length ? `${sel.length}개 선택` : "해당하는 걸 모두 골라주세요")}
          {!loggedIn && !msg && " · 로그인하면 저장돼요"}
        </span>
      </div>
    </div>
  );
}
