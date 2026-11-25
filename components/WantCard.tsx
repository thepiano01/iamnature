import Link from "next/link";
import { won, timeAgo, ymd } from "@/lib/format";

export type WantCardData = {
  id: number;
  keyword: string;
  quantity: number;
  unit: string;
  budget: number | null;
  neededBy: Date | null;
  region: string | null;
  note: string | null;
  status: string;
  createdAt: Date;
  buyer: { name: string | null };
  _count: { offers: number; targets: number };
};

const STATUS: Record<string, [string, string]> = {
  OPEN: ["찾는 중", "bg-butter-100 text-bark-900"],
  MATCHED: ["거래 연결됨", "bg-forest-100 text-forest-800"],
  CLOSED: ["마감", "bg-hanji-200 text-bark-500"],
};

export default function WantCard({ w, badge }: { w: WantCardData; badge?: React.ReactNode }) {
  const st = STATUS[w.status] ?? STATUS.OPEN;
  return (
    <Link href={`/wants/${w.id}`} className="flex flex-col gap-2 rounded-[1.5rem] bg-white p-4 shadow-[var(--shadow-card)] ring-1 ring-hanji-200/70 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${st[1]}`}>{st[0]}</span>
        <span className="text-[11px] text-bark-400">{timeAgo(w.createdAt)}</span>
      </div>
      <p className="text-lg font-extrabold tracking-[-0.02em] text-bark-900">
        🙋 {w.keyword} <span className="text-forest-700">{w.quantity}{w.unit}</span> 구해요
      </p>
      <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold text-bark-500">
        {w.budget && <span className="rounded-full bg-hanji-100 px-2 py-0.5">희망 {won(w.budget)}/{w.unit}</span>}
        {w.neededBy && <span className="rounded-full bg-hanji-100 px-2 py-0.5">{ymd(w.neededBy)}까지</span>}
        {w.region && <span className="rounded-full bg-hanji-100 px-2 py-0.5">📍 {w.region}</span>}
      </div>
      {w.note && <p className="line-clamp-2 text-sm text-bark-500">{w.note}</p>}
      <div className="mt-auto flex items-center justify-between pt-1 text-xs">
        <span className="font-bold text-bark-700">💬 제안 {w._count.offers}개</span>
        {badge}
      </div>
    </Link>
  );
}
