import Link from "next/link";
import ProductArt from "./ProductArt";
import MatchRing from "./MatchRing";
import { daysAgo, won } from "@/lib/format";
import { categoryLabel, labelOf } from "@/lib/health";

export type CardData = {
  id: number;
  title: string;
  price: number;
  unit: string;
  quantity: number;
  region?: string | null;
  formState?: string | null;
  harvestDate?: Date | string | null;
  imageUrl?: string | null;
  images?: { url: string }[];
  plant?: { commonName: string; category: string | null; conditions: { condition: { code: string; name: string } }[] } | null;
  seller?: { name: string | null; sellerProfile: { farmName: string | null; verified: boolean } | null } | null;
  matched?: string[];
  reviews?: { rating: number }[];
};

function Verified() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" className="shrink-0 text-forest-600" fill="currentColor" aria-label="인증 채취자">
      <path d="M12 2l2.4 2.2 3.2-.4.9 3.1 2.8 1.7-1 3.1 1 3.1-2.8 1.7-.9 3.1-3.2-.4L12 22l-2.4-2.2-3.2.4-.9-3.1-2.8-1.7 1-3.1-1-3.1 2.8-1.7.9-3.1 3.2.4Zm-1.2 13.6 5.7-5.7-1.4-1.4-4.3 4.3-2-2-1.4 1.4Z" />
    </svg>
  );
}

export default function ProductCard({ p, highlight = [], compact = false }: { p: CardData; highlight?: string[]; compact?: boolean }) {
  const img = p.images?.[0]?.url || p.imageUrl;
  const conds = p.plant?.conditions.map((c) => c.condition) ?? [];
  const matched = p.matched ?? conds.filter((c) => highlight.includes(c.code)).map((c) => c.code);
  const pct = highlight.length ? Math.round((matched.length / highlight.length) * 100) : 0;
  const harvested = daysAgo(p.harvestDate);
  const farm = p.seller?.sellerProfile?.farmName || p.seller?.name;
  const lowStock = p.quantity > 0 && p.quantity <= 3;
  const rn = p.reviews?.length ?? 0;
  const ravg = rn ? p.reviews!.reduce((a, r) => a + r.rating, 0) / rn : 0;

  return (
    <Link
      href={`/products/${p.id}`}
      className={`group flex flex-col rounded-[var(--radius-card)] bg-white p-2 shadow-[var(--shadow-card)] ring-1 ring-hanji-200/70 transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] ${compact ? "w-[236px] shrink-0 snap-start" : ""}`}
    >
      <div className="relative aspect-square overflow-hidden rounded-[1.25rem] bg-hanji-100">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={p.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <ProductArt category={p.plant?.category} label={p.title} className="h-full w-full transition duration-500 group-hover:scale-105" />
        )}
        {harvested && (
          <span className="glass absolute left-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-bold text-forest-800">🌱 {harvested}</span>
        )}
        {matched.length > 0 && pct > 0 && (
          <span className="glass absolute right-2 top-2 rounded-full p-0.5 shadow-sm">
            <MatchRing value={pct} size={38} stroke={4} tone="peach" />
          </span>
        )}
        {lowStock && (
          <span className="absolute bottom-2 left-2 rounded-full bg-bark-900/80 px-2.5 py-1 text-[10px] font-bold text-white">{p.quantity}{p.unit} 남음</span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 px-2 pb-2 pt-3">
        <div className="flex items-center gap-1 text-[11px] font-medium text-bark-400">
          <span className="text-forest-700">{categoryLabel(p.plant?.category)}</span>
          {p.region && <span>· {p.region}</span>}
        </div>
        <h3 className="line-clamp-2 text-[15px] font-bold leading-snug tracking-[-0.01em] text-bark-900">{p.title}</h3>
        {rn > 0 && (
          <p className="flex items-center gap-1 text-[11px] font-bold text-bark-700">
            <span className="text-butter-500">★</span>
            {ravg.toFixed(1)}
            <span className="font-medium text-bark-400">({rn})</span>
          </p>
        )}
        {matched.length > 0 ? (
          <p className="text-[11px] font-bold text-clay-600">내 {matched.map(labelOf).join("·")}에 맞아요</p>
        ) : (
          conds.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {conds.slice(0, 3).map((c) => (
                <span key={c.code} className="rounded-full bg-hanji-100 px-2 py-0.5 text-[10px] font-semibold text-bark-500">{c.name}</span>
              ))}
            </div>
          )
        )}
        <div className="mt-auto flex items-end justify-between gap-2 pt-1.5">
          <p className="text-[17px] font-extrabold tracking-[-0.02em] text-bark-900">
            {won(p.price)}
            <span className="ml-0.5 text-[11px] font-medium text-bark-400">/{p.unit}</span>
          </p>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-forest-50 text-lg font-bold text-forest-700 transition group-hover:bg-forest-800 group-hover:text-white">+</span>
        </div>
        {farm && (
          <p className="flex items-center gap-1 truncate text-[11px] text-bark-400">
            {farm}
            {p.seller?.sellerProfile?.verified && <Verified />}
          </p>
        )}
      </div>
    </Link>
  );
}

export function ProductGrid({ items, highlight }: { items: CardData[]; highlight?: string[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {items.map((p) => (
        <ProductCard key={p.id} p={p} highlight={highlight} />
      ))}
    </div>
  );
}

export function ProductRail({ items, highlight }: { items: CardData[]; highlight?: string[] }) {
  return (
    <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
      {items.map((p) => (
        <ProductCard key={p.id} p={p} highlight={highlight} compact />
      ))}
    </div>
  );
}

export function EmptyState({ title, desc, action }: { title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="mesh flex flex-col items-center gap-3 rounded-[var(--radius-card)] px-6 py-14 text-center">
      <ProductArt category="HERB" className="h-16 w-16 rounded-3xl shadow-sm" />
      <p className="font-bold text-bark-900">{title}</p>
      {desc && <p className="max-w-sm text-sm text-bark-500">{desc}</p>}
      {action}
    </div>
  );
}
