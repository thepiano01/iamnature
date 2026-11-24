"use client";

import { useRef, useState } from "react";
import { cx } from "@/lib/format";

/**
 * 상품 카드 사진 넘겨보기
 * - 모바일: 손가락으로 좌우 스와이프 (scroll-snap)
 * - PC: 마우스를 올리면 ‹ › 버튼
 * - 아래 점(●○○○○)으로 현재 위치 표시
 * 카드 전체가 링크라서, 버튼을 누를 땐 상세 페이지로 이동하지 않게 막습니다.
 */
export default function CardCarousel({ images, alt }: { images: string[]; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const n = images.length;

  const go = (e: React.MouseEvent, to: number) => {
    e.preventDefault();
    e.stopPropagation();
    const el = ref.current;
    if (!el) return;
    const next = (to + n) % n;
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="group/car absolute inset-0">
      <div
        ref={ref}
        onScroll={(e) => {
          const el = e.currentTarget;
          setIdx(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
        }}
        className="no-scrollbar flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
      >
        {images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src + i}
            src={src}
            alt={`${alt} ${i + 1}`}
            loading={i === 0 ? "eager" : "lazy"}
            draggable={false}
            className="h-full w-full shrink-0 snap-center object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ))}
      </div>

      {n > 1 && (
        <>
          <button
            type="button"
            aria-label="이전 사진"
            onClick={(e) => go(e, idx - 1)}
            className="glass absolute left-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-lg font-bold text-bark-900 opacity-0 shadow transition group-hover/car:opacity-100 md:grid"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="다음 사진"
            onClick={(e) => go(e, idx + 1)}
            className="glass absolute right-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-lg font-bold text-bark-900 opacity-0 shadow transition group-hover/car:opacity-100 md:grid"
          >
            ›
          </button>
          <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1">
            {images.map((_, i) => (
              <span key={i} className={cx("h-1.5 rounded-full transition-all", i === idx ? "w-4 bg-white" : "w-1.5 bg-white/60")} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
