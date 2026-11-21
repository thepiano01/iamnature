"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BAD_TAGS, GOOD_TAGS } from "@/lib/reviews";
import { uploadImage } from "@/lib/compressImage";
import { cx } from "@/lib/format";

const LABEL = ["", "별로예요", "아쉬워요", "보통이에요", "좋아요", "최고예요!"];

export default function ReviewForm({ orderItemId, farm }: { orderItemId: number; farm: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const tagList = rating && rating <= 2 ? BAD_TAGS : GOOD_TAGS;

  const toggle = (t: string) => setTags((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  return (
    <div className="mt-6 space-y-6 pb-10">
      <section className="rounded-[1.75rem] bg-white p-6 text-center shadow-[var(--shadow-card)]">
        <p className="font-bold text-bark-900">{farm}님과의 거래, 어떠셨어요?</p>
        <div className="mt-3 flex justify-center gap-1.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              aria-label={`${i}점`}
              onClick={() => {
                setRating(i);
                if ((i <= 2) !== (rating <= 2 && rating > 0)) setTags([]);
              }}
              className="transition active:scale-90"
            >
              <svg width="40" height="40" viewBox="0 0 24 24"><path fill={i <= rating ? "#f59e0b" : "#e5ece9"} d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9Z" /></svg>
            </button>
          ))}
        </div>
        <p className="mt-1 h-5 text-sm font-bold text-butter-500">{LABEL[rating]}</p>
      </section>

      {rating > 0 && (
        <section className="space-y-3">
          <p className="font-bold text-bark-900">{rating <= 2 ? "어떤 점이 아쉬웠나요?" : "어떤 점이 좋았나요?"} <span className="text-sm font-normal text-bark-400">(여러 개 선택)</span></p>
          <div className="flex flex-wrap gap-2">
            {tagList.map((t) => (
              <button key={t} type="button" onClick={() => toggle(t)} className={cx("rounded-full px-4 py-2 text-sm font-bold transition active:scale-95", tags.includes(t) ? (rating <= 2 ? "bg-bark-700 text-white" : "bg-forest-800 text-white") : "bg-white text-bark-700 ring-1 ring-hanji-200")}>
                {t}
              </button>
            ))}
          </div>
          {rating <= 2 && <p className="text-xs text-bark-400">아쉬운 점 태그는 채취자 신뢰 온도에만 반영되고, 다른 사람에게는 보이지 않아요.</p>}
        </section>
      )}

      {rating > 0 && (
        <section className="space-y-3">
          <p className="font-bold text-bark-900">후기 남기기 <span className="text-sm font-normal text-bark-400">(선택)</span></p>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} maxLength={1000} className="input min-h-32 leading-relaxed" placeholder="맛, 향, 신선도, 손질 상태, 어떻게 드셨는지 들려주세요." />
          <div className="flex gap-2">
            {photos.map((p) => (
              <div key={p} className="relative h-20 w-20 overflow-hidden rounded-xl ring-1 ring-hanji-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => setPhotos((x) => x.filter((y) => y !== p))} className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-[10px] text-white">✕</button>
              </div>
            ))}
            {photos.length < 5 && (
              <button type="button" onClick={() => fileRef.current?.click()} className="grid h-20 w-20 place-items-center rounded-xl border-2 border-dashed border-hanji-300 text-xs text-bark-400 hover:border-forest-600">
                {uploading ? "…" : "📷 사진"}
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={async (e) => {
                const files = Array.from(e.target.files || []).slice(0, 5 - photos.length);
                setUploading(true);
                for (const f of files) {
                  try {
                    const url = await uploadImage(f);
                    setPhotos((x) => [...x, url]);
                  } catch (er) {
                    setErr((er as Error).message);
                  }
                }
                setUploading(false);
                e.target.value = "";
              }}
            />
          </div>
        </section>
      )}

      {err && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>}
      <button
        className="btn-primary w-full py-4 text-base"
        disabled={!rating || pending || uploading}
        onClick={() =>
          start(async () => {
            setErr(null);
            const res = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderItemId, rating, tags, content, photos }) });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.ok) return setErr(data.error || "저장하지 못했어요.");
            router.push("/orders?reviewed=1");
            router.refresh();
          })
        }
      >
        {pending ? "등록 중…" : rating ? "후기 등록하기" : "별점을 먼저 골라주세요"}
      </button>
    </div>
  );
}
