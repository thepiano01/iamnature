"use client";

import { useState } from "react";
import ProductArt from "./ProductArt";
import { cx } from "@/lib/format";

export default function Gallery({ images, title, category }: { images: string[]; title: string; category?: string | null }) {
  const [i, setI] = useState(0);
  if (!images.length) {
    return <ProductArt category={category} label={title} className="aspect-square w-full rounded-[2rem]" />;
  }
  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-hanji-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[i]} alt={`${title} ${i + 1}`} className="h-full w-full object-cover" />
        {images.length > 1 && (
          <>
            <button aria-label="이전" onClick={() => setI((i - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-bark-900 shadow backdrop-blur hover:bg-white">‹</button>
            <button aria-label="다음" onClick={() => setI((i + 1) % images.length)} className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-bark-900 shadow backdrop-blur hover:bg-white">›</button>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white">{i + 1} / {images.length}</span>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {images.map((src, idx) => (
            <button key={src + idx} onClick={() => setI(idx)} className={cx("h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-2 transition", idx === i ? "ring-forest-700" : "ring-transparent opacity-70 hover:opacity-100")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
