"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function DeleteProductButton({ id, hasOrders }: { id: number; hasOrders: boolean }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  if (!confirm)
    return (
      <button className="btn-sm rounded-full px-3 text-xs text-bark-400 hover:text-rose-600" onClick={() => setConfirm(true)}>
        {hasOrders ? "판매중지" : "삭제"}
      </button>
    );
  return (
    <button
      className="btn-sm rounded-full bg-rose-600 px-3 text-xs font-semibold text-white"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await fetch(`/api/sell/products/${id}`, { method: "DELETE" });
          setConfirm(false);
          router.refresh();
        })
      }
    >
      정말 {hasOrders ? "중지" : "삭제"}?
    </button>
  );
}
