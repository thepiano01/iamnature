"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

const NEXT: Record<string, [string, string][]> = {
  PENDING: [["SHIPPED", "발송 처리"], ["CANCELLED", "주문 취소"]],
  PAID: [["SHIPPED", "발송 처리"], ["CANCELLED", "주문 취소"]],
  SHIPPED: [["COMPLETED", "배송 완료"]],
};

export default function StatusButtons({ id, status }: { id: number; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const actions = NEXT[status] ?? [];
  if (!actions.length) return null;
  return (
    <div className="flex gap-2 sm:flex-col sm:justify-center">
      {actions.map(([to, label]) => (
        <button
          key={to}
          disabled={pending}
          className={to === "CANCELLED" ? "btn-sm rounded-full px-3 text-xs text-bark-400 hover:text-rose-600" : "btn-primary btn-sm"}
          onClick={() => {
            if (to === "CANCELLED" && !window.confirm("이 주문을 취소할까요? 재고는 다시 늘어납니다.")) return;
            start(async () => {
              await fetch(`/api/sell/order-items/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: to }) });
              router.refresh();
            });
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
