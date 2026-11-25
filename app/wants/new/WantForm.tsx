"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UNITS } from "@/lib/health";

export default function WantForm({ plants, initialKeyword, defaultRegion }: { plants: { id: number; commonName: string }[]; initialKeyword: string; defaultRegion: string }) {
  const router = useRouter();
  const [keyword, setKeyword] = useState(initialKeyword);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const plant = plants.find((p) => p.commonName === keyword.trim());
  const quick = ["송이버섯", "능이버섯", "곰취", "더덕", "산마늘(명이)", "두릅", "고사리", "오미자"];

  return (
    <form
      className="mt-6 space-y-5 pb-10"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = Object.fromEntries(new FormData(e.currentTarget));
        setErr(null);
        start(async () => {
          const res = await fetch("/api/wants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...fd, keyword, plantId: plant?.id ?? null }) });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.ok) return setErr(data.error || "올리지 못했어요.");
          router.push(`/wants/${data.id}?sent=${data.sent ?? 0}`);
          router.refresh();
        });
      }}
    >
      <section className="card space-y-3 p-5">
        <label className="label">품목</label>
        <input list="plant-list" value={keyword} onChange={(e) => setKeyword(e.target.value)} required maxLength={40} placeholder="예: 송이버섯" className="input py-3.5 text-base font-bold" />
        <datalist id="plant-list">{plants.map((p) => <option key={p.id} value={p.commonName} />)}</datalist>
        <div className="flex flex-wrap gap-1.5">
          {quick.map((q) => (
            <button key={q} type="button" onClick={() => setKeyword(q)} className="chip border-hanji-300 bg-white text-bark-700 hover:border-forest-600">{q}</button>
          ))}
        </div>
        {plant && <p className="text-xs font-semibold text-forest-700">✓ 식물 정보와 연결돼서 더 정확한 채취자에게 전달돼요</p>}
      </section>

      <section className="card grid gap-4 p-5 sm:grid-cols-2">
        <div className="grid grid-cols-[1fr_90px] gap-2">
          <div>
            <label className="label">수량</label>
            <input name="quantity" type="number" min={1} defaultValue={1} required className="input" />
          </div>
          <div>
            <label className="label">단위</label>
            <select name="unit" defaultValue="kg" className="input px-2">{UNITS.map((u) => <option key={u}>{u}</option>)}</select>
          </div>
        </div>
        <div>
          <label className="label">희망 가격 (단위당, 선택)</label>
          <input name="budget" type="number" min={0} step={1000} placeholder="예: 150000" className="input" />
        </div>
        <div>
          <label className="label">언제까지 필요하세요? (선택)</label>
          <input name="neededBy" type="date" className="input" />
        </div>
        <div>
          <label className="label">받는 지역 (선택)</label>
          <input name="region" defaultValue={defaultRegion} placeholder="예: 서울 강남구" className="input" />
        </div>
      </section>

      <section className="card space-y-2 p-5">
        <label className="label">하고 싶은 말 (선택)</label>
        <textarea name="note" maxLength={500} className="input min-h-28" placeholder="예: 추석 선물용이라 상품(上品)으로 구해요. 갓이 덜 핀 것이면 좋겠어요." />
      </section>

      {err && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>}
      <button className="btn-accent w-full py-4 text-base" disabled={pending}>{pending ? "보내는 중…" : "채취자들에게 요청 보내기"}</button>
      <p className="text-center text-xs text-bark-400">연락처·주소는 채취자에게 공개되지 않아요. 제안을 수락하고 주문할 때만 배송 정보가 전달돼요.</p>
    </form>
  );
}
