"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { won } from "@/lib/format";

type P = { id: number; title: string; price: number; unit: string };

export function OfferForm({ requestId, unit, defaults, products, editing }: { requestId: number; unit: string; defaults: { price: number; quantity: number; message: string; productId: number | null }; products: P[]; editing: boolean }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  return (
    <form
      className="space-y-4 rounded-[1.5rem] bg-white p-5 shadow-[var(--shadow-card)]"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = Object.fromEntries(new FormData(e.currentTarget));
        setErr(null);
        start(async () => {
          const res = await fetch(`/api/wants/${requestId}/offers`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...fd, unit }) });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.ok) return setErr(data.error || "보내지 못했어요.");
          setDone(true);
          router.refresh();
        });
      }}
    >
      <p className="text-lg font-extrabold text-bark-900">{editing ? "보낸 제안 수정" : "제안 보내기"}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">단위당 가격 (원 / {unit})</label>
          <input name="price" type="number" min={100} step={100} required defaultValue={defaults.price || ""} className="input" />
        </div>
        <div>
          <label className="label">보낼 수 있는 수량 ({unit})</label>
          <input name="quantity" type="number" min={1} required defaultValue={defaults.quantity} className="input" />
        </div>
      </div>
      <div>
        <label className="label">판매 상품 연결 (선택 · 연결하면 구매자가 바로 주문해요)</label>
        <select name="productId" defaultValue={defaults.productId ?? ""} className="input">
          <option value="">연결 안 함 (수락되면 나중에 연결)</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.title} · {won(p.price)}/{p.unit}</option>)}
        </select>
      </div>
      <div>
        <label className="label">구매자에게 한마디</label>
        <textarea name="message" maxLength={500} defaultValue={defaults.message} className="input min-h-24" placeholder="예: 이번 주 토요일 봉화에서 채취 예정이에요. 갓 안 핀 1등품으로 골라 보내드릴게요." />
      </div>
      {err && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>}
      {done && <p className="rounded-xl bg-forest-50 px-3 py-2 text-sm font-semibold text-forest-800">제안을 보냈어요. 구매자에게 알림이 갔어요 ✓</p>}
      <button className="btn-primary w-full py-3.5" disabled={pending}>{pending ? "보내는 중…" : editing ? "제안 수정하기" : "제안 보내기"}</button>
    </form>
  );
}

export function AttachProduct({ offerId, products }: { offerId: number; products: P[] }) {
  const router = useRouter();
  const [id, setId] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="mt-3 space-y-2">
      <p className="text-sm text-forest-800">판매 상품을 연결하면 구매자에게 알림이 가고 바로 주문할 수 있어요.</p>
      <div className="flex gap-2">
        <select value={id} onChange={(e) => setId(e.target.value)} className="input bg-white">
          <option value="">내 상품 선택</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.title} · {won(p.price)}/{p.unit}</option>)}
        </select>
        <button
          className="btn-primary shrink-0"
          disabled={!id || pending}
          onClick={() =>
            start(async () => {
              const res = await fetch(`/api/offers/${offerId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "attach", productId: Number(id) }) });
              const data = await res.json().catch(() => ({}));
              if (!res.ok || !data.ok) return setErr(data.error || "연결하지 못했어요.");
              router.refresh();
            })
          }
        >
          연결
        </button>
      </div>
      <Link href="/sell/products/new" className="inline-block text-xs font-bold text-forest-700 underline">새 상품 먼저 등록하기 →</Link>
      {err && <p className="text-xs text-rose-600">{err}</p>}
    </div>
  );
}
