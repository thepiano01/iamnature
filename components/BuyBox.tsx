"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { won } from "@/lib/format";

export default function BuyBox({ productId, price, unit, stock, loggedIn, own }: { productId: number; price: number; unit: string; stock: number; loggedIn: boolean; own: boolean }) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const soldOut = stock <= 0;

  const add = (goCheckout: boolean) =>
    start(async () => {
      if (!loggedIn) {
        router.push(`/login?next=/products/${productId}`);
        return;
      }
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: qty }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setMsg({ text: data.error || "담지 못했습니다.", ok: false });
        return;
      }
      router.refresh();
      if (goCheckout) router.push("/cart");
      else setMsg({ text: "장바구니에 담았어요.", ok: true });
    });

  return (
    <>
    {/* 모바일 하단 고정 구매 바 */}
    {!own && (
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-hanji-200 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur-xl md:hidden">
        {msg && <p className={`mb-2 text-center text-xs font-semibold ${msg.ok ? "text-forest-700" : "text-rose-600"}`}>{msg.text}</p>}
        <div className="flex items-center gap-2">
          <div className="mr-1 min-w-0">
            <p className="text-[11px] font-semibold text-bark-400">{qty}{unit}</p>
            <p className="text-lg font-extrabold tracking-[-0.02em] text-bark-900">{won(price * qty)}</p>
          </div>
          <button className="btn-ghost ml-auto px-4" disabled={pending || soldOut} onClick={() => add(false)} aria-label="장바구니 담기">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"><path d="M5 7h14l-1.2 11.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9Z" /><path d="M9 10V6a3 3 0 0 1 6 0v4" strokeLinecap="round" /></svg>
          </button>
          <button className="btn-accent px-7" disabled={pending || soldOut} onClick={() => add(true)}>{soldOut ? "품절" : "바로 구매"}</button>
        </div>
      </div>
    )}
    <div className="space-y-4 rounded-[1.5rem] bg-white p-4 shadow-[var(--shadow-card)] ring-1 ring-hanji-200/70">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-bark-700">수량 ({unit})</span>
        <div className="flex items-center overflow-hidden rounded-2xl bg-hanji-100">
          <button className="h-9 w-9 text-lg text-bark-700 hover:bg-hanji-100 disabled:opacity-30" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1 || soldOut} aria-label="수량 줄이기">−</button>
          <span className="w-10 text-center text-sm font-semibold">{qty}</span>
          <button className="h-9 w-9 text-lg text-bark-700 hover:bg-hanji-100 disabled:opacity-30" onClick={() => setQty((q) => Math.min(stock, q + 1))} disabled={qty >= stock || soldOut} aria-label="수량 늘리기">+</button>
        </div>
      </div>
      <div className="flex items-baseline justify-between border-t border-hanji-200 pt-3">
        <span className="text-sm text-bark-500">총 상품금액</span>
        <span className="text-2xl font-extrabold tracking-[-0.02em] text-forest-800">{won(price * qty)}</span>
      </div>
      {own ? (
        <p className="rounded-xl bg-white px-3 py-2.5 text-center text-sm text-bark-500">내가 등록한 상품입니다.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-ghost py-3" disabled={pending || soldOut} onClick={() => add(false)}>장바구니</button>
          <button className="btn-accent py-3" disabled={pending || soldOut} onClick={() => add(true)}>{soldOut ? "품절" : "바로 구매"}</button>
        </div>
      )}
      {msg && (
        <p className={`text-center text-xs ${msg.ok ? "text-forest-700" : "text-rose-600"}`}>
          {msg.text} {msg.ok && <a href="/cart" className="font-semibold underline">장바구니 보기</a>}
        </p>
      )}
    </div>
    </>
  );
}
