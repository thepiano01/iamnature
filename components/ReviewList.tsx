import Link from "next/link";
import { Stars } from "./TrustTemp";
import { maskName, parsePhotos, parseTags, GOOD_TAGS } from "@/lib/reviews";
import { ymd } from "@/lib/format";

export type ReviewItem = {
  id: number;
  rating: number;
  tags: string;
  content: string | null;
  photos: string;
  createdAt: Date;
  buyer: { name: string | null };
  product?: { id: number; title: string } | null;
};

const GOOD = new Set<string>(GOOD_TAGS);

export default function ReviewList({ reviews, showProduct = false }: { reviews: ReviewItem[]; showProduct?: boolean }) {
  if (!reviews.length) return <p className="rounded-2xl bg-hanji-100 px-4 py-6 text-center text-sm text-bark-500">아직 후기가 없어요. 첫 후기를 기다리고 있어요 🌱</p>;
  return (
    <ul className="divide-y divide-hanji-200">
      {reviews.map((r) => {
        const tags = parseTags(r.tags).filter((t) => GOOD.has(t));
        const photos = parsePhotos(r.photos);
        return (
          <li key={r.id} className="py-5 first:pt-0">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-forest-100 to-clay-100 text-sm font-extrabold text-bark-700">{(r.buyer.name || "구").slice(0, 1)}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-bark-900">{maskName(r.buyer.name)}</p>
                <div className="flex items-center gap-1.5 text-[11px] text-bark-400">
                  <Stars value={r.rating} size={12} />
                  <span>{ymd(r.createdAt)}</span>
                </div>
              </div>
            </div>
            {showProduct && r.product && (
              <Link href={`/products/${r.product.id}`} className="mt-2 inline-block rounded-lg bg-hanji-100 px-2 py-1 text-[11px] font-semibold text-bark-500 hover:text-forest-700">
                {r.product.title}
              </Link>
            )}
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {tags.map((t) => (
                  <span key={t} className="rounded-full bg-forest-50 px-2.5 py-1 text-[11px] font-bold text-forest-800">{t}</span>
                ))}
              </div>
            )}
            {r.content && <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-bark-700">{r.content}</p>}
            {photos.length > 0 && (
              <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
                {photos.map((src) => (
                  <a key={src} href={src} target="_blank" rel="noreferrer" className="h-20 w-20 shrink-0 overflow-hidden rounded-xl ring-1 ring-hanji-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="후기 사진" className="h-full w-full object-cover" loading="lazy" />
                  </a>
                ))}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function RatingSummary({ avg, n, dist }: { avg: number; n: number; dist: { star: number; n: number }[] }) {
  return (
    <div className="flex items-center gap-6 rounded-[1.5rem] bg-white p-5 ring-1 ring-hanji-200/70">
      <div className="text-center">
        <p className="text-4xl font-extrabold tracking-[-0.03em] text-bark-900">{n ? avg.toFixed(1) : "-"}</p>
        <Stars value={avg} size={16} />
        <p className="mt-1 text-xs text-bark-400">후기 {n}개</p>
      </div>
      <div className="flex-1 space-y-1">
        {dist.map((d) => (
          <div key={d.star} className="flex items-center gap-2 text-[11px] text-bark-500">
            <span className="w-6">{d.star}점</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-hanji-100">
              <div className="h-full rounded-full bg-butter-500" style={{ width: `${n ? (d.n / n) * 100 : 0}%` }} />
            </div>
            <span className="w-5 text-right">{d.n}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PraiseTags({ tags, limit = 6 }: { tags: { tag: string; n: number }[]; limit?: number }) {
  if (!tags.length) return null;
  return (
    <ul className="grid gap-1.5 sm:grid-cols-2">
      {tags.slice(0, limit).map((t) => (
        <li key={t.tag} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-hanji-200/70">
          <span className="font-semibold text-bark-700">{t.tag}</span>
          <span className="flex items-center gap-1 text-xs font-bold text-forest-700">👥 {t.n}</span>
        </li>
      ))}
    </ul>
  );
}
