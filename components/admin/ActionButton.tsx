"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

/** 관리자 공용 버튼: API 호출 후 새로고침. askReason이면 사유 입력 후 body.reason으로 전송 */
export default function ActionButton({
  url,
  method = "PATCH",
  body,
  label,
  confirm,
  askReason,
  className = "btn-ghost btn-sm",
}: {
  url: string;
  method?: string;
  body?: Record<string, unknown>;
  label: string;
  confirm?: string;
  askReason?: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col items-start">
      <button
        className={className}
        disabled={pending}
        onClick={() => {
          let reason: string | null = null;
          if (askReason) {
            reason = window.prompt(askReason);
            if (!reason?.trim()) return;
          } else if (confirm && !window.confirm(confirm)) return;
          setErr(null);
          start(async () => {
            const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, ...(reason ? { reason } : {}) }) });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.ok) setErr(data.error || "실패했습니다.");
            router.refresh();
          });
        }}
      >
        {pending ? "…" : label}
      </button>
      {err && <span className="mt-1 text-[11px] text-rose-600">{err}</span>}
    </span>
  );
}
