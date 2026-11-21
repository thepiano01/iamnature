import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { ORDER_STATUS } from "@/lib/health";
import { won, ymd } from "@/lib/format";
import { Badge, PageHead } from "@/components/admin/ui";

export const metadata: Metadata = { title: "관리자" };
export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const since = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13);

  const [users, sellers, onSale, hidden, pendingSellers, monthItems, recentItems, recentOrders, recentUsers, plantsNoCond] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: { in: ["SELLER", "BOTH"] } } }),
    prisma.product.count({ where: { quantity: { gt: 0 }, hidden: false } }),
    prisma.product.count({ where: { hidden: true } }),
    prisma.sellerProfile.findMany({
      where: { verified: false, rejectReason: null, OR: [{ permitImage: { not: null } }, { idCardImage: { not: null } }] },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { updatedAt: "asc" },
      take: 5,
    }),
    prisma.orderItem.findMany({ where: { createdAt: { gte: monthStart }, sellerStatus: { not: "CANCELLED" } }, select: { subtotal: true, orderId: true } }),
    prisma.orderItem.findMany({ where: { createdAt: { gte: since }, sellerStatus: { not: "CANCELLED" } }, select: { subtotal: true, createdAt: true } }),
    prisma.order.findMany({ include: { buyer: { select: { name: true } }, items: { select: { productTitle: true } } }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.plant.count({ where: { conditions: { none: {} } } }),
  ]);

  const monthGmv = monthItems.reduce((s, i) => s + i.subtotal, 0);
  const monthOrders = new Set(monthItems.map((i) => i.orderId)).size;
  const toShip = await prisma.orderItem.count({ where: { sellerStatus: { in: ["PAID", "PENDING"] } } });

  const days = Array.from({ length: 14 }, (_, k) => {
    const d = new Date(since);
    d.setDate(d.getDate() + k);
    const key = d.toDateString();
    const v = recentItems.filter((i) => i.createdAt.toDateString() === key).reduce((s, i) => s + i.subtotal, 0);
    return { label: `${d.getMonth() + 1}/${d.getDate()}`, v };
  });
  const max = Math.max(1, ...days.map((d) => d.v));

  const kpis: [string, string, string, string?][] = [
    ["이번 달 거래액", won(monthGmv), `주문 ${monthOrders}건`],
    ["발송 대기", `${toShip}건`, "채취자 발송 전", toShip ? "/admin/orders?s=PAID" : undefined],
    ["인증 대기", `${pendingSellers.length}명`, "채취자 서류 심사", pendingSellers.length ? "/admin/sellers" : undefined],
    ["회원", `${users}명`, `이번 달 +${recentUsers} · 채취자 ${sellers}`],
    ["판매 중 상품", `${onSale}개`, hidden ? `숨김 ${hidden}개` : "숨김 없음"],
    ["효능 미연결 식물", `${plantsNoCond}종`, "건강 매칭에 안 나와요", plantsNoCond ? "/admin/plants?f=nocond" : undefined],
  ];

  return (
    <>
      <PageHead eyebrow="Admin" title="운영 대시보드" desc={`${ymd(now)} 기준`} />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        {kpis.map(([l, v, s, href]) => {
          const alert = !!href;
          const body = (
            <>
              <p className={`text-xs ${alert ? "text-white/80" : "text-bark-500"}`}>{l}</p>
              <p className="mt-1 font-serif text-2xl font-bold">{v}</p>
              <p className={`mt-1 text-[11px] ${alert ? "text-white/80" : "text-bark-400"}`}>{s}{alert && " →"}</p>
            </>
          );
          return href ? (
            <Link key={l} href={href} className="rounded-2xl bg-clay-500 p-5 text-white transition hover:bg-clay-600">{body}</Link>
          ) : (
            <div key={l} className="card p-5">{body}</div>
          );
        })}
      </div>

      <section className="card p-5">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-bold">최근 14일 거래액</h2>
          <span className="text-xs text-bark-400">취소 제외 · 합계 {won(days.reduce((s, d) => s + d.v, 0))}</span>
        </div>
        <div className="flex h-40 items-end gap-1.5">
          {days.map((d) => (
            <div key={d.label} className="group flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[9px] text-bark-500 opacity-0 transition group-hover:opacity-100">{d.v ? `${Math.round(d.v / 1000)}k` : ""}</span>
              <div className="w-full rounded-t-md bg-forest-600 transition group-hover:bg-clay-500" style={{ height: `${Math.max(d.v ? 4 : 1, (d.v / max) * 100)}%`, opacity: d.v ? 1 : 0.2 }} />
              <span className="text-[9px] text-bark-400">{d.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">인증 대기 채취자</h2>
            <Link href="/admin/sellers" className="text-xs font-semibold text-forest-700 hover:underline">심사하기 →</Link>
          </div>
          {pendingSellers.length ? (
            <ul className="divide-y divide-hanji-100">
              {pendingSellers.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span>
                    <b>{s.farmName || s.user.name}</b> <span className="text-xs text-bark-400">{s.user.email}</span>
                  </span>
                  <span className="text-xs text-bark-400">{ymd(s.updatedAt)} 제출</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-bark-400">대기 중인 심사가 없어요.</p>
          )}
        </section>

        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">최근 주문</h2>
            <Link href="/admin/orders" className="text-xs font-semibold text-forest-700 hover:underline">전체 →</Link>
          </div>
          {recentOrders.length ? (
            <ul className="divide-y divide-hanji-100">
              {recentOrders.map((o) => {
                const st = ORDER_STATUS[o.status] ?? ORDER_STATUS.PENDING;
                return (
                  <li key={o.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="min-w-0">
                      <span className="line-clamp-1">
                        #{o.id} {o.items[0]?.productTitle}
                        {o.items.length > 1 && ` 외 ${o.items.length - 1}건`}
                      </span>
                      <span className="text-xs text-bark-400">{o.buyer?.name} · {ymd(o.createdAt)}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <Badge tone={o.status === "COMPLETED" ? "green" : o.status === "CANCELLED" ? "rose" : o.status === "SHIPPED" ? "sky" : "amber"}>{st.label}</Badge>
                      <b>{won(o.totalPrice)}</b>
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-bark-400">아직 주문이 없어요.</p>
          )}
        </section>
      </div>
    </>
  );
}
