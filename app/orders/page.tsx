import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ORDER_STATUS } from "@/lib/health";
import { won, ymd } from "@/lib/format";
import { EmptyState } from "@/components/ProductCard";

export const metadata: Metadata = { title: "주문 내역" };
export const dynamic = "force-dynamic";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ done?: string }> }) {
  const { done } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/orders");
  const orders = await prisma.order.findMany({
    where: { buyerId: user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container-x max-w-3xl pt-8 sm:pt-12">
      <p className="eyebrow">Orders</p>
      <h1 className="h-serif mt-1 text-3xl sm:text-4xl">주문 내역</h1>

      {done && (
        <div className="mt-6 rounded-2xl border border-forest-100 bg-forest-50 p-5">
          <p className="font-serif text-xl font-bold text-forest-900">주문이 접수됐어요 🌿</p>
          <p className="mt-1 text-sm text-forest-800">채취자가 확인 후 산지에서 바로 손질해 보내드릴게요. (주문번호 #{done})</p>
        </div>
      )}

      <div className="mt-8 space-y-4">
        {!orders.length && <EmptyState title="아직 주문한 상품이 없어요" action={<Link href="/products" className="btn-primary btn-sm">상품 보러 가기</Link>} />}
        {orders.map((o) => {
          const st = ORDER_STATUS[o.status] ?? ORDER_STATUS.PENDING;
          return (
            <article key={o.id} className="card overflow-hidden">
              <header className="flex items-center justify-between border-b border-hanji-200 bg-hanji-50 px-5 py-3">
                <div className="text-sm">
                  <b>{ymd(o.createdAt)}</b>
                  <span className="ml-2 text-bark-400">#{o.id}</span>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${st.tone}`}>{st.label}</span>
              </header>
              <ul className="divide-y divide-hanji-100 px-5">
                {o.items.map((i) => {
                  const ist = ORDER_STATUS[i.sellerStatus] ?? st;
                  return (
                    <li key={i.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                      <Link href={`/products/${i.productId}`} className="line-clamp-1 hover:underline">{i.productTitle} × {i.quantity}</Link>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${ist.tone}`}>{ist.label}</span>
                        <span className="font-medium">{won(i.subtotal)}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <footer className="flex justify-between border-t border-hanji-200 px-5 py-3 text-sm">
                <span className="text-bark-500">{o.shippingName} · {o.shippingAddress1}</span>
                <b className="text-forest-900">{won(o.totalPrice)}</b>
              </footer>
            </article>
          );
        })}
      </div>
    </div>
  );
}
