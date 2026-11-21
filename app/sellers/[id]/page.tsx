import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser, isSellerRole } from "@/lib/auth";
import { cardInclude } from "@/lib/products";
import { sellerStats } from "@/lib/sellerStats";
import { codesFromUser } from "@/lib/health";
import { ymd } from "@/lib/format";
import TrustTemp, { Stars } from "@/components/TrustTemp";
import ReviewList, { PraiseTags } from "@/components/ReviewList";
import { EmptyState, ProductGrid } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

async function load(id: number) {
  if (!id) return null;
  const u = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, role: true, createdAt: true, sellerProfile: { select: { farmName: true, verified: true } } } });
  return u && isSellerRole(u.role) ? u : null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const u = await load(Number((await params).id));
  return { title: u ? `${u.sellerProfile?.farmName || u.name} 채취자` : "채취자" };
}

export default async function SellerPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const seller = await load(id);
  if (!seller) notFound();
  const [stats, products, reviews, me] = await Promise.all([
    sellerStats(id),
    prisma.product.findMany({ where: { sellerId: id, hidden: false, quantity: { gt: 0 } }, include: cardInclude, orderBy: { createdAt: "desc" }, take: 24 }),
    prisma.review.findMany({ where: { sellerId: id, hidden: false }, include: { buyer: { select: { name: true } }, product: { select: { id: true, title: true } } }, orderBy: { createdAt: "desc" }, take: 20 }),
    getCurrentUser(),
  ]);
  const farm = seller.sellerProfile?.farmName || seller.name || "채취자";

  return (
    <div className="container-x max-w-4xl space-y-6 pt-8 sm:pt-12">
      {/* 프로필 */}
      <section className="mesh rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-forest-500 to-forest-800 text-2xl font-extrabold text-white shadow-[var(--shadow-card)]">{farm.slice(0, 1)}</div>
            <div>
              <h1 className="flex flex-wrap items-center gap-2 text-2xl font-extrabold tracking-[-0.02em] text-bark-900">
                {farm}
                {seller.sellerProfile?.verified && <span className="rounded-full bg-forest-100 px-2.5 py-1 text-[11px] font-bold text-forest-800">✓ 인증 채취자</span>}
              </h1>
              <p className="mt-1 text-sm text-bark-500">{ymd(seller.createdAt)} 입점</p>
            </div>
          </div>
          <TrustTemp temp={stats.temp} />
        </div>
        <dl className="mt-6 grid grid-cols-3 gap-2">
          {[
            ["거래 완료", `${stats.completed}회`],
            ["받은 후기", `${stats.n}개`],
            ["평균 별점", stats.n ? `★ ${stats.avg.toFixed(1)}` : "-"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-white/80 p-3 text-center">
              <dt className="text-[11px] font-semibold text-bark-400">{k}</dt>
              <dd className="mt-0.5 text-lg font-extrabold text-bark-900">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 받은 칭찬 */}
      <section className="card p-5 sm:p-6">
        <h2 className="mb-3 text-lg font-extrabold text-bark-900">받은 칭찬</h2>
        {stats.goodTags.length ? <PraiseTags tags={stats.goodTags} limit={9} /> : <p className="text-sm text-bark-400">아직 받은 칭찬이 없어요.</p>}
      </section>

      {/* 후기 */}
      <section className="card p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-bark-900">구매 후기 {stats.n}</h2>
          {stats.n > 0 && (
            <span className="flex items-center gap-1.5 text-sm">
              <Stars value={stats.avg} /> <b>{stats.avg.toFixed(1)}</b>
            </span>
          )}
        </div>
        <ReviewList reviews={reviews} showProduct />
      </section>

      {/* 판매 상품 */}
      <section>
        <h2 className="mb-4 text-lg font-extrabold text-bark-900">판매 중인 상품 {products.length}</h2>
        {products.length ? <ProductGrid items={products} highlight={codesFromUser(me)} /> : <EmptyState title="지금은 판매 중인 상품이 없어요" desc="곧 새로 채취한 상품이 올라올 거예요." />}
      </section>
    </div>
  );
}
