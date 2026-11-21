"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cx } from "@/lib/format";

const NAV = [
  { href: "/", label: "홈" },
  { href: "/match", label: "건강 매칭" },
  { href: "/products", label: "둘러보기" },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-1 rounded-2xl bg-hanji-100 p-1 md:flex">
      {NAV.map((n) => {
        const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
        return (
          <Link key={n.href} href={n.href} className={cx("rounded-xl px-4 py-2 text-sm font-bold transition", active ? "bg-white text-bark-900 shadow-sm" : "text-bark-500 hover:text-bark-900")}>
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function LogoutButton({ className = "btn-ghost btn-sm" }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      className={className}
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
    >
      로그아웃
    </button>
  );
}

const Icon = {
  home: <path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z" />,
  shop: <><rect x="4" y="4" width="7" height="7" rx="2" /><rect x="13" y="4" width="7" height="7" rx="2" /><rect x="4" y="13" width="7" height="7" rx="2" /><rect x="13" y="13" width="7" height="7" rx="2" /></>,
  match: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />,
  cart: <><path d="M5 7h14l-1.2 11.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9Z" /><path d="M9 10V6a3 3 0 0 1 6 0v4" /></>,
  me: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
};

export function MobileTabBar({ cartCount, loggedIn }: { cartCount: number; loggedIn: boolean }) {
  const pathname = usePathname();
  if (pathname.startsWith("/sell") || pathname.startsWith("/admin") || /^\/products\/\d+/.test(pathname)) return null;
  const tabs = [
    { href: "/", label: "홈", icon: Icon.home },
    { href: "/products", label: "둘러보기", icon: Icon.shop },
    { href: "/match", label: "매칭", icon: Icon.match, center: true },
    { href: "/cart", label: "장바구니", icon: Icon.cart, badge: cartCount },
    { href: loggedIn ? "/me" : "/login", label: loggedIn ? "MY" : "로그인", icon: Icon.me },
  ];
  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="grid h-[68px] bg-white/95 backdrop-blur-xl grid-cols-5 items-center rounded-[26px] shadow-[0_12px_40px_-12px_rgb(23_33_43/0.35)] ring-1 ring-white/70">
        {tabs.map((t) => {
          const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
          if (t.center)
            return (
              <Link key={t.label} href={t.href} className="flex flex-col items-center" aria-label="건강 매칭">
                <span className={cx("-mt-7 grid h-14 w-14 place-items-center rounded-full text-white shadow-[0_10px_24px_-8px_rgb(15_118_110/0.8)] ring-4 ring-hanji-50 transition active:scale-95", active ? "bg-clay-500" : "bg-gradient-to-br from-forest-500 to-forest-800")}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">{t.icon}</svg>
                </span>
                <span className={cx("mt-0.5 text-[10px] font-bold", active ? "text-clay-600" : "text-bark-500")}>{t.label}</span>
              </Link>
            );
          return (
            <Link key={t.label} href={t.href} className={cx("relative flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition", active ? "text-forest-800" : "text-bark-400")}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 2} strokeLinecap="round" strokeLinejoin="round">{t.icon}</svg>
              {t.label}
              {!!t.badge && <span className="absolute right-[18%] top-0 grid h-4 min-w-4 place-items-center rounded-full bg-clay-500 px-1 text-[9px] font-bold text-white">{t.badge}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
