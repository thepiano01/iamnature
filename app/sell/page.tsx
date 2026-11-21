import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { sellerPage } from "@/lib/auth";
import { ORDER_STATUS } from "@/lib/health";
import { won, ymd } from "@/lib/format";
import { sellerStats } from "@/lib/sellerStats";
import TrustTemp from "@/components/TrustTemp";
import ReviewList from "@/components/ReviewList";

export const metadata: Metadata = { title: "채취자 센터" };
export const dynamic = "force-dynamic";

export default async function SellDashboard() {
  const me = await sellerPage();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [items, products] = await Promise.all([
    prisma.orderItem.findMany({ where: { sellerId: me.id }, include: { order: { select: { shippingName: true, createdAt: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.product.findMany({ where: { sellerId: me.id }, select: { id: true, title: true, quantity: true, unit: true } }),
  ]);

  const [stats, myReviews] = await Promise.all([
    sellerStats(me.id),
    prisma.review.findMany({ where: { sellerId: me.id, hidden: false }, include: { buyer: { select: { name: true } }, product: { select: { id: true, title: true } } }, orderBy: { createdAt: "desc" }, take: 3 }),
  ]);
  const valid = items.filter((i) => i.sellerStatus !== "CANCELLED");
  const monthSales = valid.filter((i) => i.createdAt >= monthStart).reduce((s, i) => s + i.subtotal, 0);
  const totalSales = valid.reduce((s, i) => s + i.subtotal, 0);
  const toShip = items.filter((i) => i.sellerStatus === "PAID" || i.sellerStatus === "PENDING").length;
  const shipping = items.filter((i) => i.sellerStatus === "SHIPPED").length;
  const onSale = products.filter((p) => p.quantity > 0).length;
  const low = products.filter((p) => p.quantity <= 3).sort((a, b) => a.quantity - b.quantity).slice(0, 5);

  const kpis = [
    ["이번 달 매출", won(monthSales), `누적 ${won(totalSales)}`],
    ["발송할 주문", `${toShip}건`, toShip ? "빨리 보내주세요!" : "모두 처리했어요"],
    ["배송 중", `${shipping}건`, ""],
    ["판매 중 상품", `${onSale}개`, `전체 ${products.length}개`],
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1 className="h-serif mt-1 text-3xl">오늘도 산에 다녀오셨나요?</h1>
        </div>
        <Link href="/sell/products/new" className="btn-accent">+ 새 상품 올리기</Link>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {kpis.map(([l, v, s], i) => (
          <div key={l} className={`rounded-2xl p-5 ${i === 1 && toShip ? "bg-clay-500 text-white" : "card"}`}>
            <p className={`text-xs ${i === 1 && toShip ? "text-white/80" : "text-bark-500"}`}>{l}</p>
            <p className="mt-1 font-serif text-2xl font-bold">{v}</p>
            {s && <p className={`mt-1 text-[11px] ${i === 1 && toShip ? "text-white/80" : "text-bark-400"}`}>{s}</p>}
          </div>
        ))}
      </div>

      <section className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="text-xs font-bold text-bark-400">내 신뢰 온도</p>
          <p className="mt-1 text-sm text-bark-500">
            거래 {stats.completed}회 · 후기 {stats.n}개{stats.n ? ` · 평균 ★${stats.avg.toFixed(1)}` : ""}
          </p>
          <Link href={`/sellers/${me.id}`} className="mt-2 inline-block text-xs font-bold text-forest-700 hover:underline">구매자에게 보이는 내 프로필 →</Link>
        </div>
        <TrustTemp temp={stats.temp} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">최근 주문</h2>
            <Link href="/sell/orders" className="text-xs font-semibold text-forest-700 hover:underline">전체 보기 →</Link>
          </div>
          {items.length ? (
            <ul className="divide-y divide-hanji-100">
              {items.slice(0, 6).map((i) => {
                const st = ORDER_STATUS[i.sellerStatus] ?? ORDER_STATUS.PENDING;
                return (
                  <li key={i.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="line-clamp-1 font-medium">{i.productTitle} × {i.quantity}</p>
                      <p className="text-xs text-bark-400">{ymd(i.order.createdAt)} · {i.order.shippingName}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${st.tone}`}>{st.label}</span>
                      <span className="font-semibold">{won(i.subtotal)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-bark-400">아직 들어온 주문이 없어요.</p>
          )}
        </section>

        <section className="card p-5">
          <h2 className="mb-3 font-bold">재고 확인 필요</h2>
          {low.length ? (
            <ul className="space-y-2">
              {low.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                  <Link href={`/sell/products/${p.id}/edit`} className="line-clamp-1 hover:underline">{p.title}</Link>
                  <span className={`shrink-0 text-xs font-bold ${p.quantity === 0 ? "text-rose-600" : "text-clay-600"}`}>{p.quantity === 0 ? "품절" : `${p.quantity}${p.unit}`}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-bark-400">재고가 넉넉해요.</p>
          )}
        </section>
      </div>
      <section className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">최근 받은 후기</h2>
          <Link href={`/sellers/${me.id}`} className="text-xs font-semibold text-forest-700 hover:underline">전체 보기 →</Link>
        </div>
        <ReviewList reviews={myReviews} showProduct />
      </section>
    </div>
  );
}
