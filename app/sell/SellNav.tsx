"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/format";

const ITEMS = [
  ["/sell", "대시보드"],
  ["/sell/products", "내 상품"],
  ["/sell/products/new", "+ 상품 올리기"],
  ["/sell/orders", "주문 관리"],
  ["/sell/wants", "🙋 구매 요청"],
  ["/sell/verify", "채취자 인증"],
  ["/", "← 쇼핑몰로"],
] as const;

export default function SellNav() {
  const pathname = usePathname();
  return (
    <nav className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
      {ITEMS.map(([href, label]) => {
        const active = href === "/sell" ? pathname === "/sell" : href === "/sell/products" ? pathname === href || /\/sell\/products\/\d+/.test(pathname) : pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cx(
              "shrink-0 rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
              active ? "bg-white font-semibold text-forest-900 shadow-sm ring-1 ring-hanji-200" : "text-bark-500 hover:bg-hanji-100 hover:text-bark-900",
              href === "/sell/products/new" && !active && "text-clay-600",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
