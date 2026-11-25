import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { cx } from "@/lib/format";
import WantCard from "@/components/WantCard";
import { EmptyState } from "@/components/ProductCard";

export const metadata: Metadata = { title: "구해요" };
export const dynamic = "force-dynamic";

export default async function WantsPage({ searchParams }: { searchParams: Promise<{ s?: string; mine?: string }> }) {
  const { s = "OPEN", mine } = await searchParams;
  const user = await getCurrentUser();
  const where = { ...(s === "ALL" ? {} : { status: s }), ...(mine && user ? { buyerId: user.id } : {}) };
  const list = await prisma.wantRequest.findMany({
    where,
    include: { buyer: { select: { name: true } }, _count: { select: { offers: true, targets: true } } },
    orderBy: { createdAt: "desc" },
    take: 60,
  });
  const tab = (label: string, q: string, on: boolean) => (
    <Link href={`/wants${q}`} className={cx("chip shrink-0", on ? "border-forest-800 bg-forest-800 text-white" : "border-hanji-300 bg-white text-bark-700")}>{label}</Link>
  );

  return (
    <div>
      <section className="mesh">
        <div className="container-x flex flex-col items-start justify-between gap-5 py-10 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold text-forest-700">🙋 구해요</p>
            <h1 className="h-serif mt-2 text-3xl leading-tight sm:text-4xl">찾는 자연산이 없나요?</h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-bark-500">
              필요한 품목을 올리면 <b className="text-bark-900">그 품목을 팔아본 채취자</b>에게 먼저 알림이 가요. 채취자가 가격·수량을 제안하면 골라서 바로 주문하세요.
            </p>
          </div>
          <Link href={user ? "/wants/new" : "/login?next=/wants/new"} className="btn-accent shrink-0">+ 구해요 올리기</Link>
        </div>
      </section>
      <div className="container-x space-y-5 pt-8">
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {tab("찾는 중", "", s === "OPEN" && !mine)}
          {tab("거래 연결됨", "?s=MATCHED", s === "MATCHED" && !mine)}
          {tab("전체", "?s=ALL", s === "ALL" && !mine)}
          {user && tab("내 요청", "?s=ALL&mine=1", !!mine)}
        </div>
        {list.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((w) => <WantCard key={w.id} w={w} />)}
          </div>
        ) : (
          <EmptyState title="아직 올라온 요청이 없어요" desc="찾는 품목이 있다면 첫 번째로 올려보세요." action={<Link href="/wants/new" className="btn-primary btn-sm">구해요 올리기</Link>} />
        )}
      </div>
    </div>
  );
}
