import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ORDER_STATUS } from "@/lib/health";
import { won, ymd } from "@/lib/format";
import ActionButton from "@/components/admin/ActionButton";
import { Badge, PageHead, SearchBox, Tabs } from "@/components/admin/ui";
import { EmptyState } from "@/components/ProductCard";

export const metadata: Metadata = { title: "주문 관리" };
export const dynamic = "force-dynamic";

const STATUSES = ["PAID", "SHIPPED", "COMPLETED", "CANCELLED"];
const tone = (s: string) => (s === "COMPLETED" ? "green" : s === "CANCELLED" ? "rose" : s === "SHIPPED" ? "sky" : "amber") as "green";

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ s?: string; q?: string }> }) {
  const { s = "", q } = await searchParams;
  const qn = Number(q);
  const where: Prisma.OrderWhereInput = {
    AND: [
      s ? { status: s === "PAID" ? { in: ["PAID", "PENDING"] } : s } : {},
      q
        ? {
            OR: [
              ...(qn ? [{ id: qn }] : []),
              { shippingName: { contains: q } },
              { shippingPhone: { contains: q } },
              { buyer: { email: { contains: q } } },
              { items: { some: { productTitle: { contains: q } } } },
            ],
          }
        : {},
    ],
  };
  const [counts, total, orders] = await Promise.all([
    Promise.all(STATUSES.map((st) => prisma.order.count({ where: { status: st === "PAID" ? { in: ["PAID", "PENDING"] } : st } }))),
    prisma.order.count(),
    prisma.order.findMany({
      where,
      include: {
        buyer: { select: { name: true, email: true } },
        items: { include: { product: { select: { seller: { select: { name: true, sellerProfile: { select: { farmName: true } } } } } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return (
    <>
      <PageHead eyebrow="Orders" title="전체 주문" desc="고객 문의가 오면 여기서 찾아 상태를 직접 바꿀 수 있어요. 취소하면 재고가 복구됩니다." />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          base={`/admin/orders${q ? `?q=${encodeURIComponent(q)}` : ""}`}
          active={s ? `s=${s}` : ""}
          tabs={[["", "전체", total], ...STATUSES.map((st, i) => [`s=${st}`, ORDER_STATUS[st].label, counts[i]] as [string, string, number])]}
        />
        <SearchBox action="/admin/orders" q={q} placeholder="주문번호·받는분·연락처·상품명" hidden={{ s }} />
      </div>

      {!orders.length ? (
        <EmptyState title="해당하는 주문이 없어요" />
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id} className="card overflow-hidden">
              <header className="flex flex-wrap items-center justify-between gap-2 border-b border-hanji-200 bg-hanji-50 px-5 py-3 text-sm">
                <div className="flex items-center gap-2">
                  <b>#{o.id}</b>
                  <Badge tone={tone(o.status)}>{ORDER_STATUS[o.status]?.label ?? o.status}</Badge>
                  <span className="text-xs text-bark-400">{ymd(o.createdAt)} · {o.buyer?.name} ({o.buyer?.email})</span>
                </div>
                <b className="text-forest-900">{won(o.totalPrice)}</b>
              </header>
              <ul className="divide-y divide-hanji-100 px-5">
                {o.items.map((i) => (
                  <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="line-clamp-1">{i.productTitle} × {i.quantity} <span className="text-bark-400">· {won(i.subtotal)}</span></p>
                      <p className="text-xs text-bark-400">채취자: {i.product.seller?.sellerProfile?.farmName || i.product.seller?.name}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone={tone(i.sellerStatus)}>{ORDER_STATUS[i.sellerStatus]?.label ?? i.sellerStatus}</Badge>
                      {STATUSES.filter((st) => st !== i.sellerStatus && !(st === "PAID" && i.sellerStatus === "PENDING")).map((st) => (
                        <ActionButton
                          key={st}
                          url={`/api/admin/order-items/${i.id}`}
                          body={{ status: st }}
                          label={`→ ${ORDER_STATUS[st].label}`}
                          className="rounded-full border border-hanji-300 px-2 py-0.5 text-[11px] text-bark-500 hover:border-bark-900 hover:text-bark-900"
                          confirm={`#${o.id} ‘${i.productTitle}’ 상태를 ‘${ORDER_STATUS[st].label}’(으)로 바꿀까요?`}
                        />
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
              <footer className="border-t border-hanji-100 px-5 py-2.5 text-xs text-bark-500">
                {o.shippingName} · {o.shippingPhone} · {o.shippingZip && `(${o.shippingZip}) `}{o.shippingAddress1} {o.shippingAddress2}
                {o.requestMessage && <span className="text-clay-700"> · 요청: {o.requestMessage}</span>}
              </footer>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
