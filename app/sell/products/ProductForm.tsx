"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FORM_STATES, UNITS } from "@/lib/health";
import { cx } from "@/lib/format";

export type PlantOption = { id: number; commonName: string; category: string | null; conditions: string[] };
export type ProductValues = {
  id?: number;
  title: string;
  plantId: number | null;
  plantName: string;
  region: string;
  harvestDate: string;
  formState: string;
  unit: string;
  price: number | "";
  quantity: number | "";
  description: string;
  images: string[];
};

export const EMPTY_PRODUCT: ProductValues = {
  title: "",
  plantId: null,
  plantName: "",
  region: "",
  harvestDate: new Date().toISOString().slice(0, 10),
  formState: "생것",
  unit: "kg",
  price: "",
  quantity: "",
  description: "",
  images: [],
};

export default function ProductForm({ plants, initial }: { plants: PlantOption[]; initial: ProductValues }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [err, setErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof ProductValues>(k: K, val: ProductValues[K]) => setV((p) => ({ ...p, [k]: val }));
  const plant = plants.find((p) => p.id === v.plantId);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setErr(null);
    const urls: string[] = [];
    for (const f of Array.from(files).slice(0, 10 - v.images.length)) {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (data.ok) urls.push(data.url);
      else setErr(data.error || "업로드 실패");
    }
    setV((p) => ({ ...p, images: [...p.images, ...urls] }));
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = () =>
    start(async () => {
      setErr(null);
      const res = await fetch(v.id ? `/api/sell/products/${v.id}` : "/api/sell/products", {
        method: v.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(v),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) return setErr(data.error || "저장하지 못했습니다.");
      router.push("/sell/products");
      router.refresh();
    });

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      {/* 사진 */}
      <section className="card space-y-3 p-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-bold">사진</p>
            <p className="text-xs text-bark-500">첫 번째 사진이 대표 이미지가 돼요. 채취 현장 사진이 있으면 신뢰도가 올라가요. (최대 10장)</p>
          </div>
          <span className="text-xs text-bark-400">{v.images.length}/10</span>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {v.images.map((src, i) => (
            <div key={src} className="group relative aspect-square overflow-hidden rounded-xl ring-1 ring-hanji-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
              {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-md bg-forest-900 px-1.5 py-0.5 text-[10px] font-bold text-white">대표</span>}
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/50 p-1.5 opacity-0 transition group-hover:opacity-100">
                {i > 0 ? (
                  <button type="button" className="rounded bg-white/90 px-1.5 text-[10px] font-semibold" onClick={() => set("images", [src, ...v.images.filter((x) => x !== src)])}>대표로</button>
                ) : (
                  <span />
                )}
                <button type="button" className="rounded bg-white/90 px-1.5 text-[10px] font-semibold text-rose-600" onClick={() => set("images", v.images.filter((x) => x !== src))}>삭제</button>
              </div>
            </div>
          ))}
          {v.images.length < 10 && (
            <button type="button" onClick={() => fileRef.current?.click()} className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-hanji-300 text-bark-400 transition hover:border-forest-600 hover:text-forest-700">
              <span className="text-center text-xs">
                <span className="block text-2xl">+</span>
                {uploading ? "올리는 중…" : "사진 추가"}
              </span>
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => upload(e.target.files)} />
      </section>

      {/* 기본 정보 */}
      <section className="card grid gap-4 p-5">
        <p className="font-bold">무엇을 캐셨나요?</p>
        <div>
          <label className="label">식물 종류 (건강 매칭에 사용돼요)</label>
          <select className="input" value={v.plantId ?? ""} onChange={(e) => set("plantId", e.target.value ? Number(e.target.value) : null)}>
            <option value="">목록에 없음 — 직접 입력</option>
            {plants.map((p) => (
              <option key={p.id} value={p.id}>{p.commonName}</option>
            ))}
          </select>
          {plant ? (
            plant.conditions.length ? (
              <p className="mt-2 rounded-lg bg-clay-50 px-3 py-2 text-xs text-clay-700">이 상품은 <b>{plant.conditions.join(" · ")}</b> 건강상태를 고른 고객에게 추천돼요.</p>
            ) : (
              <p className="mt-2 text-xs text-bark-400">이 식물은 아직 건강상태 정보가 연결되지 않았어요.</p>
            )
          ) : (
            <input className="input mt-2" placeholder="식물 이름 (예: 참취)" value={v.plantName} onChange={(e) => set("plantName", e.target.value)} />
          )}
        </div>
        <div>
          <label className="label">상품명</label>
          <input className="input" required placeholder="예: 강원 태백 해발 800m 자연산 곰취 1kg" value={v.title} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">채취 산지</label>
            <input className="input" placeholder="예: 강원 태백" value={v.region} onChange={(e) => set("region", e.target.value)} />
          </div>
          <div>
            <label className="label">채취일</label>
            <input className="input" type="date" value={v.harvestDate} onChange={(e) => set("harvestDate", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">상태</label>
          <div className="flex flex-wrap gap-1.5">
            {FORM_STATES.map((f) => (
              <button type="button" key={f} onClick={() => set("formState", f)} className={cx("chip", v.formState === f ? "border-forest-800 bg-forest-800 text-white" : "border-hanji-300 text-bark-700")}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 가격 */}
      <section className="card grid gap-4 p-5 sm:grid-cols-3">
        <p className="font-bold sm:col-span-3">가격·수량</p>
        <div>
          <label className="label">판매 단위</label>
          <select className="input" value={v.unit} onChange={(e) => set("unit", e.target.value)}>
            {UNITS.map((u) => <option key={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="label">단위당 가격 (원)</label>
          <input className="input" type="number" min={100} step={100} required value={v.price} onChange={(e) => set("price", e.target.value === "" ? "" : Number(e.target.value))} />
        </div>
        <div>
          <label className="label">판매 수량 ({v.unit})</label>
          <input className="input" type="number" min={0} required value={v.quantity} onChange={(e) => set("quantity", e.target.value === "" ? "" : Number(e.target.value))} />
        </div>
      </section>

      <section className="card space-y-2 p-5">
        <p className="font-bold">설명</p>
        <textarea className="input min-h-40 leading-relaxed" placeholder={"어디서, 어떻게 캤는지 들려주세요.\n예) 태백 함백산 북사면 해발 800m에서 이른 아침 손으로 한 장씩 뜯었습니다. 잎이 연하고 향이 진할 때라 쌈이나 장아찌로 좋아요."} value={v.description} onChange={(e) => set("description", e.target.value)} />
      </section>

      {err && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>}
      <div className="flex gap-2">
        <button type="button" className="btn-ghost" onClick={() => router.back()}>취소</button>
        <button className="btn-primary flex-1 py-3" disabled={pending || uploading}>{pending ? "저장 중…" : v.id ? "수정 저장" : "상품 올리기"}</button>
      </div>
    </form>
  );
}
