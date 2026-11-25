import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { sellerPage } from "@/lib/auth";
import { WANT_REASON } from "@/lib/wants";
import { cx } from "@/lib/format";
import WantCard from "@/components/WantCard";
import { EmptyState } from "@/components/ProductCard";

export const metadata: Metadata = { title: "구매 요청" };
export const dynamic = "force-dynamic";

export default async function SellWants({ searchParams }: { searchParams: Promise<{ all?: string }> }) {
  const me = await sellerPage();
  const { all } = await searchParams;
  const include = { buyer: { select: { name: true } }, _count: { select: { offers: true, targets: true } }, offers: { where: { sellerId: me.id }, select: { status: true } }, targets: { where: { sellerId: me.id }, select: { reason: true } } };
  const list = await prisma.wantRequest.findMany({
    where: all ? { status: "OPEN", buyerId: { not: me.id } } : { targets: { some: { sellerId: me.id } } },
    include,
    orderBy: { createdAt: "desc" },
    take: 60,
  });
  const MY: Record<string, [string, string]> = { SENT: ["제안 보냄", "text-forest-700"], ACCEPTED: ["🎉 수락됨", "text-clay-600"], DECLINED: ["거절됨", "text-bark-400"] };

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Requests</p>
        <h1 className="h-serif mt-1 text-3xl">구매 요청</h1>
        <p className="mt-1 text-sm text-bark-500">구매자가 찾는 품목이에요. 회원님이 팔았거나 팔고 있는 품목이면 맞춤으로 먼저 전달돼요.</p>
      </div>
      <div className="flex gap-1.5">
        <Link href="/sell/wants" className={cx("chip", !all ? "border-forest-800 bg-forest-800 text-white" : "border-hanji-300 bg-white text-bark-700")}>🎯 나에게 온 요청</Link>
        <Link href="/sell/wants?all=1" className={cx("chip", all ? "border-forest-800 bg-forest-800 text-white" : "border-hanji-300 bg-white text-bark-700")}>찾는 중인 전체 요청</Link>
      </div>
      {list.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {list.map((w) => {
            const mine = w.offers[0];
            const reason = w.targets[0]?.reason;
            return (
              <WantCard
                key={w.id}
                w={w}
                badge={
                  mine ? (
                    <span className={`font-bold ${MY[mine.status]?.[1]}`}>{MY[mine.status]?.[0]}</span>
                  ) : reason ? (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${WANT_REASON[reason]?.tone}`}>{WANT_REASON[reason]?.label}</span>
                  ) : (
                    <span className="font-bold text-clay-600">제안하기 →</span>
                  )
                }
              />
            );
          })}
        </div>
      ) : (
        <EmptyState title={all ? "지금 찾는 중인 요청이 없어요" : "아직 나에게 온 요청이 없어요"} desc="상품을 등록하고 판매하면 그 품목을 찾는 구매자의 요청이 여기로 와요." />
      )}
    </div>
  );
}
