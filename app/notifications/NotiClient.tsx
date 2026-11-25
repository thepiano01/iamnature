"use client";

import { useRouter } from "next/navigation";
import { timeAgo } from "@/lib/format";

const read = (body: object) => fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export function NotiItem({ n }: { n: { id: number; title: string; body: string | null; link: string | null; read: boolean; at: string } }) {
  const router = useRouter();
  return (
    <li>
      <button
        onClick={async () => {
          if (!n.read) await read({ id: n.id });
          if (n.link) router.push(n.link);
          router.refresh();
        }}
        className={`flex w-full items-start gap-3 rounded-2xl p-4 text-left transition ${n.read ? "bg-white ring-1 ring-hanji-200" : "bg-forest-50 ring-1 ring-forest-100"}`}
      >
        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-clay-500"}`} />
        <span className="min-w-0 flex-1">
          <span className={`block text-sm ${n.read ? "font-semibold text-bark-700" : "font-extrabold text-bark-900"}`}>{n.title}</span>
          {n.body && <span className="mt-0.5 block text-xs text-bark-500">{n.body}</span>}
          <span className="mt-1 block text-[11px] text-bark-400">{timeAgo(n.at)}</span>
        </span>
      </button>
    </li>
  );
}

export function ReadAllButton() {
  const router = useRouter();
  return (
    <button className="text-sm font-bold text-forest-700 hover:underline" onClick={async () => { await read({ all: true }); router.refresh(); }}>
      모두 읽음
    </button>
  );
}
