import Link from "next/link";
import Logo from "./Logo";
import { getCurrentUser, isSellerRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MobileTabBar, NavLinks } from "./NavClient";

export default async function SiteHeader() {
  const user = await getCurrentUser();
  const [cartCount, notiCount] = user
    ? await Promise.all([prisma.cartItem.count({ where: { userId: user.id } }), prisma.notification.count({ where: { userId: user.id, readAt: null } })])
    : [0, 0];
  const seller = isSellerRole(user?.role);

  return (
    <>
      <header className="glass sticky top-0 z-40 border-b border-white/60">
        <div className="container-x flex h-16 items-center justify-between gap-4">
          <Logo />
          <NavLinks />
          <div className="flex items-center gap-1.5">
            <Link href="/products" className="grid h-10 w-10 place-items-center rounded-2xl text-bark-700 transition hover:bg-hanji-100" aria-label="검색">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" /></svg>
            </Link>
            {user && (
              <Link href="/notifications" className="relative grid h-10 w-10 place-items-center rounded-2xl text-bark-700 transition hover:bg-hanji-100" aria-label="알림">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" /></svg>
                {notiCount > 0 && <span className="absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-clay-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">{notiCount > 99 ? "99+" : notiCount}</span>}
              </Link>
            )}
            <Link href="/cart" className="relative hidden h-10 w-10 place-items-center rounded-2xl text-bark-700 transition hover:bg-hanji-100 md:grid" aria-label="장바구니">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"><path d="M5 7h14l-1.2 11.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9Z" /><path d="M9 10V6a3 3 0 0 1 6 0v4" strokeLinecap="round" /></svg>
              {cartCount > 0 && <span className="absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-clay-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">{cartCount}</span>}
            </Link>
            {user ? (
              <div className="hidden items-center gap-1.5 md:flex">
                {user.role === "ADMIN" && <Link href="/admin" className="rounded-xl bg-bark-900 px-3 py-2 text-xs font-bold text-white hover:bg-black">관리자</Link>}
                {seller && <Link href="/sell" className="rounded-xl bg-forest-50 px-3 py-2 text-xs font-bold text-forest-800 hover:bg-forest-100">채취자 센터</Link>}
                <Link href="/me" className="ml-1 grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-clay-100 to-forest-100 text-sm font-extrabold text-bark-900 ring-2 ring-white" title="내 정보">
                  {(user.name || "나").slice(0, 1)}
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link href="/login" className="rounded-xl px-3 py-2 text-sm font-bold text-bark-700 hover:bg-hanji-100">로그인</Link>
                <Link href="/register" className="btn-primary btn-sm hidden sm:inline-flex">시작하기</Link>
              </div>
            )}
          </div>
        </div>
      </header>
      <MobileTabBar cartCount={cartCount} loggedIn={!!user} />
    </>
  );
}
