"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, HEALTH } from "@/lib/health";
import { cx } from "@/lib/format";

type Cond = { code: string; evidenceLevel: string; efficacySummary: string; usageNote: string };
export type PlantFormValues = {
  id?: number;
  commonName: string;
  scientificName: string;
  englishName: string;
  category: string;
  family: string;
  status: string;
  isProtected: boolean;
  generalDescription: string;
  folkUsageSummary: string;
  effectsDetail: string;
  healthyCookingTips: string;
  cautionsDetail: string;
  toxicitySummary: string;
  conditions: Cond[];
  seasons: { startMonth: number; endMonth: number }[];
  videos: { title: string; url: string }[];
};

export const EMPTY_PLANT: PlantFormValues = {
  commonName: "", scientificName: "", englishName: "", category: "HERB", family: "", status: "DRAFT", isProtected: false,
  generalDescription: "", folkUsageSummary: "", effectsDetail: "", healthyCookingTips: "", cautionsDetail: "", toxicitySummary: "",
  conditions: [], seasons: [], videos: [],
};

const EVIDENCE = [
  ["folk", "전통·민간"],
  ["study", "연구 보고"],
  ["extract", "추출물 연구"],
  ["mixed", "혼합 근거"],
];

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-bark-400">{hint}</p>}
    </div>
  );
}

export default function PlantForm({ initial, productCount = 0 }: { initial: PlantFormValues; productCount?: number }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const set = <K extends keyof PlantFormValues>(k: K, val: PlantFormValues[K]) => {
    setSaved(false);
    setV((p) => ({ ...p, [k]: val }));
  };
  const text = (k: keyof PlantFormValues) => ({
    value: v[k] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(k, e.target.value as never),
  });

  const condOf = (code: string) => v.conditions.find((c) => c.code === code);
  const toggleCond = (code: string) =>
    set("conditions", condOf(code) ? v.conditions.filter((c) => c.code !== code) : [...v.conditions, { code, evidenceLevel: "folk", efficacySummary: "", usageNote: "" }]);
  const patchCond = (code: string, p: Partial<Cond>) => set("conditions", v.conditions.map((c) => (c.code === code ? { ...c, ...p } : c)));

  const save = () =>
    start(async () => {
      setErr(null);
      const res = await fetch(v.id ? `/api/admin/plants/${v.id}` : "/api/admin/plants", {
        method: v.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(v),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) return setErr(data.error || "저장하지 못했습니다.");
      setSaved(true);
      if (!v.id) router.push(`/admin/plants/${data.id}`);
      router.refresh();
    });

  const remove = () =>
    start(async () => {
      if (!window.confirm(`‘${v.commonName}’을(를) 삭제할까요? 되돌릴 수 없습니다.`)) return;
      const res = await fetch(`/api/admin/plants/${v.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) return setErr(data.error || "삭제하지 못했습니다.");
      router.push("/admin/plants");
      router.refresh();
    });

  return (
    <form
      className="space-y-6 pb-24"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <section className="card grid gap-4 p-5 sm:grid-cols-2">
        <p className="font-bold sm:col-span-2">기본 정보</p>
        <Field label="이름 (필수)"><input className="input" required {...text("commonName")} placeholder="곰취" /></Field>
        <Field label="학명"><input className="input italic" {...text("scientificName")} placeholder="Ligularia fischeri" /></Field>
        <Field label="영문명"><input className="input" {...text("englishName")} /></Field>
        <Field label="과(科)"><input className="input" {...text("family")} placeholder="국화과" /></Field>
        <Field label="분류">
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button type="button" key={c.code} onClick={() => set("category", c.code)} className={cx("chip", v.category === c.code ? "border-forest-800 bg-forest-800 text-white" : "border-hanji-300 text-bark-700")}>{c.label}</button>
            ))}
          </div>
        </Field>
        <Field label="상태">
          <div className="flex flex-wrap items-center gap-3">
            {[["DRAFT", "검토 전"], ["REVIEWED", "검토 완료"]].map(([k, l]) => (
              <button type="button" key={k} onClick={() => set("status", k)} className={cx("chip", v.status === k ? "border-forest-800 bg-forest-800 text-white" : "border-hanji-300 text-bark-700")}>{l}</button>
            ))}
            <label className="flex items-center gap-1.5 text-xs text-bark-700">
              <input type="checkbox" checked={v.isProtected} onChange={(e) => set("isProtected", e.target.checked)} className="accent-rose-600" /> 보호종·채취 제한
            </label>
          </div>
        </Field>
      </section>

      <section className="card space-y-4 p-5">
        <div>
          <p className="font-bold">건강상태 연결 <span className="text-sm font-normal text-bark-500">— 건강 매칭 추천 기준</span></p>
          <p className="text-xs text-bark-500">체크한 건강상태를 고른 고객에게 이 식물로 등록된 상품이 추천됩니다. 요약 문장은 상품 상세에 그대로 노출돼요.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {HEALTH.map((h) => {
            const on = !!condOf(h.code);
            return (
              <button type="button" key={h.code} onClick={() => toggleCond(h.code)} className={cx("chip", on ? "border-clay-500 bg-clay-500 text-white" : "border-hanji-300 text-bark-700 hover:border-clay-500")}>
                {on && "✓ "}{h.label}
              </button>
            );
          })}
        </div>
        {HEALTH.filter((h) => condOf(h.code)).map((h) => {
          const c = condOf(h.code)!;
          return (
            <div key={h.code} className="grid gap-3 rounded-2xl border border-clay-100 bg-clay-50/50 p-4 sm:grid-cols-[110px_1fr]">
              <div>
                <p className="font-bold text-clay-700">{h.label}</p>
                <select className="mt-2 w-full rounded-lg border border-hanji-300 bg-white px-2 py-1 text-xs" value={c.evidenceLevel} onChange={(e) => patchCond(h.code, { evidenceLevel: e.target.value })}>
                  {EVIDENCE.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </div>
              <div className="grid gap-2">
                <input className="input" placeholder="요약 (예: 혈압 관리 식단에 전통적으로 쓰여 온 나물이에요.)" value={c.efficacySummary} onChange={(e) => patchCond(h.code, { efficacySummary: e.target.value })} />
                <input className="input" placeholder="먹는 법 (예: 쌈·나물무침)" value={c.usageNote} onChange={(e) => patchCond(h.code, { usageNote: e.target.value })} />
              </div>
            </div>
          );
        })}
      </section>

      <section className="card grid gap-4 p-5">
        <p className="font-bold">상품 상세에 보이는 설명</p>
        <Field label="한 줄 소개"><textarea className="input min-h-20" {...text("generalDescription")} /></Field>
        <Field label="전통적 쓰임"><textarea className="input min-h-20" {...text("folkUsageSummary")} /></Field>
        <Field label="효능·효과 상세"><textarea className="input min-h-24" {...text("effectsDetail")} /></Field>
        <Field label="손질·조리법"><textarea className="input min-h-24" {...text("healthyCookingTips")} /></Field>
        <Field label="주의사항" hint="혼동하기 쉬운 독초, 피해야 할 사람(임신·약 복용 등)을 꼭 적어주세요."><textarea className="input min-h-24" {...text("cautionsDetail")} /></Field>
        <Field label="독성 정보"><textarea className="input min-h-16" {...text("toxicitySummary")} /></Field>
      </section>

      <section className="card space-y-4 p-5">
        <div className="flex items-center justify-between">
          <p className="font-bold">제철</p>
          <button type="button" className="btn-ghost btn-sm" onClick={() => set("seasons", [...v.seasons, { startMonth: 4, endMonth: 5 }])}>+ 기간 추가</button>
        </div>
        {v.seasons.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            {(["startMonth", "endMonth"] as const).map((k, j) => (
              <span key={k} className="flex items-center gap-2">
                {j === 1 && "~"}
                <select className="rounded-lg border border-hanji-300 bg-white px-2 py-1.5" value={s[k]} onChange={(e) => set("seasons", v.seasons.map((x, xi) => (xi === i ? { ...x, [k]: Number(e.target.value) } : x)))}>
                  {Array.from({ length: 12 }, (_, m) => <option key={m} value={m + 1}>{m + 1}월</option>)}
                </select>
              </span>
            ))}
            <button type="button" className="text-xs text-bark-400 hover:text-rose-600" onClick={() => set("seasons", v.seasons.filter((_, xi) => xi !== i))}>삭제</button>
          </div>
        ))}
        {!v.seasons.length && <p className="text-xs text-bark-400">제철을 넣으면 상품 상세에 월별 달력이 표시돼요.</p>}
      </section>

      <section className="card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <p className="font-bold">영상 <span className="text-sm font-normal text-bark-500">(유튜브 링크)</span></p>
          <button type="button" className="btn-ghost btn-sm" onClick={() => set("videos", [...v.videos, { title: "", url: "" }])}>+ 영상 추가</button>
        </div>
        {v.videos.map((x, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
            <input className="input" placeholder="제목" value={x.title} onChange={(e) => set("videos", v.videos.map((y, yi) => (yi === i ? { ...y, title: e.target.value } : y)))} />
            <input className="input" placeholder="https://youtu.be/…" value={x.url} onChange={(e) => set("videos", v.videos.map((y, yi) => (yi === i ? { ...y, url: e.target.value } : y)))} />
            <button type="button" className="text-xs text-bark-400 hover:text-rose-600" onClick={() => set("videos", v.videos.filter((_, yi) => yi !== i))}>삭제</button>
          </div>
        ))}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-hanji-200 bg-white/95 backdrop-blur">
        <div className="container-x flex items-center justify-between gap-3 py-3">
          <div className="text-sm">
            {err ? <span className="text-rose-600">{err}</span> : saved ? <span className="text-forest-700">저장했어요 ✓</span> : <span className="text-bark-400">{v.id ? `이 식물로 등록된 상품 ${productCount}개에 바로 반영돼요` : "새 식물"}</span>}
          </div>
          <div className="flex gap-2">
            {v.id && <button type="button" className="btn-sm rounded-full px-3 text-xs text-bark-400 hover:text-rose-600" onClick={remove} disabled={pending}>삭제</button>}
            <button className="btn-primary" disabled={pending}>{pending ? "저장 중…" : "저장"}</button>
          </div>
        </div>
      </div>
    </form>
  );
}
