import Link from "next/link";
import { cx } from "@/lib/format";

export function PageHead({ eyebrow, title, desc, action }: { eyebrow: string; title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="h-serif mt-1 text-3xl">{title}</h1>
        {desc && <p className="mt-1 text-sm text-bark-500">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

export function Tabs({ tabs, active, base }: { tabs: [string, string, number?][]; active: string; base: string }) {
  return (
    <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
      {tabs.map(([k, l, n]) => (
        <Link key={k} href={k ? `${base}${base.includes("?") ? "&" : "?"}${k}` : base} className={cx("chip shrink-0", active === k ? "border-bark-900 bg-bark-900 text-white" : "border-hanji-300 bg-white text-bark-700 hover:border-bark-500")}>
          {l} {n !== undefined && <span className="opacity-60">{n}</span>}
        </Link>
      ))}
    </div>
  );
}

export function SearchBox({ action, q, placeholder, hidden = {} }: { action: string; q?: string; placeholder: string; hidden?: Record<string, string | undefined> }) {
  return (
    <form action={action} className="flex max-w-md gap-2">
      {Object.entries(hidden).map(([k, v]) => v && <input key={k} type="hidden" name={k} value={v} />)}
      <input name="q" defaultValue={q} placeholder={placeholder} className="input py-2" />
      <button className="btn-primary btn-sm shrink-0">검색</button>
    </form>
  );
}

export function Badge({ tone, children }: { tone: "green" | "amber" | "rose" | "stone" | "sky" | "dark"; children: React.ReactNode }) {
  const t = {
    green: "bg-forest-100 text-forest-800",
    amber: "bg-amber-100 text-amber-800",
    rose: "bg-rose-100 text-rose-700",
    stone: "bg-stone-100 text-stone-600",
    sky: "bg-sky-100 text-sky-800",
    dark: "bg-bark-900 text-white",
  }[tone];
  return <span className={`inline-block whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-bold ${t}`}>{children}</span>;
}

export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-card)] border border-hanji-200 bg-white">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-hanji-50 text-left text-xs text-bark-500">
          <tr>{head.map((h) => <th key={h} className="whitespace-nowrap px-4 py-3 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-hanji-100">{children}</tbody>
      </table>
    </div>
  );
}
