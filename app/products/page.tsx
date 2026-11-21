import Link from "next/link";
import type { Metadata } from "next";
import { listProducts } from "@/lib/products";
import { CATEGORIES, HEALTH, codesFromUser, parseCodes } from "@/lib/health";
import { getCurrentUser } from "@/lib/auth";
import { EmptyState, ProductGrid } from "@/components/ProductCard";
import { cx } from "@/lib/format";

export const metadata: Metadata = { title: "전체 상품" };
export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | undefined>>;

const SORTS = [
  ["new", "최신 등록"],
  ["harvest", "최근 채취"],
  ["price_asc", "낮은 가격"],
  ["price_desc", "높은 가격"],
] as const;

export default async function ProductsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const q = sp.q?.trim() || "";
  const category = sp.category || "";
  const codes = parseCodes(sp.c);
  const sort = (sp.sort as "new") || "new";

  const user = await getCurrentUser();
  const [items] = await Promise.all([listProducts({ q, category, codes, sort })]);
  const myCodes = codesFromUser(user);

  const href = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams();
    const base: Record<string, string> = { q, category, c: codes.join(","), sort };
    for (const [k, v] of Object.entries({ ...base, ...patch })) if (v) p.set(k, v);
    const s = p.toString();
    return `/products${s ? `?${s}` : ""}`;
  };

  const toggleCode = (code: string) => {
    const next = codes.includes(code as never) ? codes.filter((c) => c !== code) : [...codes, code];
    return href({ c: next.join(",") || null });
  };

  const title = CATEGORIES.find((c) => c.code === category)?.label ?? (q ? `‘${q}’ 검색 결과` : "전체 상품");

  return (
    <div className="container-x pt-8 sm:pt-12">
      <div className="mb-6 flex flex-col gap-5 sm:mb-8">
        <div>
          <p className="eyebrow">Shop</p>
          <h1 className="h-serif mt-1 text-3xl sm:text-4xl">{title}</h1>
        </div>

        <form action="/products" className="relative max-w-xl">
          {category && <input type="hidden" name="category" value={category} />}
          {codes.length > 0 && <input type="hidden" name="c" value={codes.join(",")} />}
          <input name="q" defaultValue={q} placeholder="곰취, 더덕, 강원도, 관절…" className="input rounded-full py-3 pl-11 pr-24 text-[15px]" />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-bark-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" /></svg>
          <button className="btn-primary btn-sm absolute right-1.5 top-1/2 -translate-y-1/2">검색</button>
        </form>
      </div>

      {/* 필터 */}
      <div className="sticky top-16 z-20 -mx-4 mb-6 space-y-2.5 border-y border-hanji-200 bg-hanji-50/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
          <span className="shrink-0 text-xs font-semibold text-bark-500">분류</span>
          <Link href={href({ category: null })} className={cx("chip shrink-0", !category ? "border-forest-800 bg-forest-800 text-white" : "border-hanji-300 bg-white text-bark-700")}>전체</Link>
          {CATEGORIES.map((c) => (
            <Link key={c.code} href={href({ category: c.code })} className={cx("chip shrink-0", category === c.code ? "border-forest-800 bg-forest-800 text-white" : "border-hanji-300 bg-white text-bark-700 hover:border-forest-600")}>
              {c.label}
            </Link>
          ))}
        </div>
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
          <span className="shrink-0 text-xs font-semibold text-bark-500">건강</span>
          {HEALTH.map((h) => {
            const on = codes.includes(h.code);
            return (
              <Link key={h.code} href={toggleCode(h.code)} className={cx("chip shrink-0", on ? "border-clay-500 bg-clay-500 text-white" : "border-hanji-300 bg-white text-bark-700 hover:border-clay-500")}>
                {on && "✓ "}
                {h.label}
              </Link>
            );
          })}
          {myCodes.length > 0 && codes.join() !== myCodes.join() && (
            <Link href={href({ c: myCodes.join(",") })} className="chip shrink-0 border-dashed border-clay-500 text-clay-600">내 건강상태 적용</Link>
          )}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="text-bark-500">
          <b className="text-bark-900">{items.length}</b>개 상품
        </span>
        <div className="flex gap-3">
          {SORTS.map(([k, l]) => (
            <Link key={k} href={href({ sort: k })} className={cx("text-xs sm:text-sm", sort === k ? "font-bold text-forest-900" : "text-bark-400 hover:text-bark-700")}>
              {l}
            </Link>
          ))}
        </div>
      </div>

      {items.length ? (
        <ProductGrid items={items} highlight={codes.length ? codes : myCodes} />
      ) : (
        <EmptyState title="조건에 맞는 상품이 없어요" desc="필터를 줄이거나 다른 이름으로 검색해 보세요." action={<Link href="/products" className="btn-ghost btn-sm">필터 초기화</Link>} />
      )}
    </div>
  );
}
