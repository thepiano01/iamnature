import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { sellerPage } from "@/lib/auth";
import { ORDER_STATUS } from "@/lib/health";
import { cx, won, ymd } from "@/lib/format";
import { EmptyState } from "@/components/ProductCard";
import StatusButtons from "./StatusButtons";

export const metadata: Metadata = { title: "주문 관리" };
export const dynamic = "force-dynamic";

const TABS = [
  ["", "전체"],
  ["PAID", "발송 대기"],
  ["SHIPPED", "배송 중"],
  ["COMPLETED", "완료"],
  ["CANCELLED", "취소"],
] as const;

export default async function SellOrders({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const { s = "" } = await searchParams;
  const me = await sellerPage();
  const all = await prisma.orderItem.findMany({
    where: { sellerId: me.id },
    include: { order: true },
    orderBy: { createdAt: "desc" },
  });
  const items = s ? all.filter((i) => i.sellerStatus === s || (s === "PAID" && i.sellerStatus === "PENDING")) : all;
  const count = (k: string) => (k ? all.filter((i) => i.sellerStatus === k || (k === "PAID" && i.sellerStatus === "PENDING")).length : all.length);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Orders</p>
        <h1 className="h-serif mt-1 text-3xl">주문 관리</h1>
      </div>
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
        {TABS.map(([k, l]) => (
          <Link key={k} href={k ? `/sell/orders?s=${k}` : "/sell/orders"} className={cx("chip shrink-0", s === k ? "border-forest-800 bg-forest-800 text-white" : "border-hanji-300 bg-white text-bark-700")}>
            {l} <span className="opacity-60">{count(k)}</span>
          </Link>
        ))}
      </div>

      {!items.length ? (
        <EmptyState title="해당하는 주문이 없어요" />
      ) : (
        <ul className="space-y-3">
          {items.map((i) => {
            const st = ORDER_STATUS[i.sellerStatus] ?? ORDER_STATUS.PENDING;
            const o = i.order;
            return (
              <li key={i.id} className="card grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:p-5">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-bark-400">
                    <span className={`rounded-md px-1.5 py-0.5 font-semibold ${st.tone}`}>{st.label}</span>
                    <span>주문 #{o.id}</span>
                    <span>{ymd(o.createdAt)}</span>
                  </div>
                  <p className="font-semibold">
                    {i.productTitle} × {i.quantity} <span className="ml-1 text-forest-800">{won(i.subtotal)}</span>
                  </p>
                  <div className="rounded-xl bg-hanji-50 px-3 py-2 text-xs leading-relaxed text-bark-700">
                    <b>{o.shippingName}</b> · {o.shippingPhone}
                    <br />
                    {o.shippingZip && `(${o.shippingZip}) `}
                    {o.shippingAddress1} {o.shippingAddress2}
                    {o.requestMessage && <span className="mt-1 block text-clay-700">요청: {o.requestMessage}</span>}
                  </div>
                </div>
                <StatusButtons id={i.id} status={i.sellerStatus} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
