import type { Metadata } from "next";
import { allCredits } from "@/lib/credits";

export const metadata: Metadata = { title: "사진 출처" };

export default function CreditsPage() {
  const list = allCredits();
  return (
    <div className="container-x max-w-4xl pt-8 sm:pt-12">
      <h1 className="h-serif text-3xl">사진 출처</h1>
      <p className="mt-2 text-sm text-bark-500">
        샘플 상품 사진은 위키미디어 공용(Wikimedia Commons)에서 자유 이용이 허락된 사진(CC 라이선스·퍼블릭 도메인)을 크기만 줄여 사용했습니다.
      </p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {list.map((c) => (
          <li key={c.url} className="flex gap-3 rounded-2xl bg-white p-3 ring-1 ring-hanji-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.url} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" loading="lazy" />
            <div className="min-w-0 text-xs">
              <p className="truncate font-semibold text-bark-900">{c.title}</p>
              <p className="text-bark-500">저작자: {c.author}</p>
              <a href={c.source} target="_blank" rel="noreferrer" className="text-forest-700 underline">{c.license} · 원본 보기</a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
