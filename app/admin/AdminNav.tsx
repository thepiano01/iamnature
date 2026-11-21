"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/format";

const ITEMS = [
  ["/admin", "대시보드"],
  ["/admin/sellers", "채취자 인증"],
  ["/admin/users", "회원 관리"],
  ["/admin/products", "상품 관리"],
  ["/admin/orders", "주문 관리"],
  ["/admin/plants", "식물·효능 DB"],
  ["/", "← 쇼핑몰로"],
] as const;

export default function AdminNav({ pending }: { pending: number }) {
  const pathname = usePathname();
  return (
    <nav className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
      {ITEMS.map(([href, label]) => {
        const active = href === "/admin" ? pathname === "/admin" : href !== "/" && pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={cx("flex shrink-0 items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition", active ? "bg-white font-semibold text-bark-900 shadow-sm ring-1 ring-hanji-200" : "text-bark-500 hover:bg-hanji-100 hover:text-bark-900")}>
            {label}
            {href === "/admin/sellers" && pending > 0 && <span className="rounded-full bg-clay-500 px-1.5 text-[10px] font-bold text-white">{pending}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
