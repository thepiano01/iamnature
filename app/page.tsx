import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { listProducts, recommend } from "@/lib/products";
import { CATEGORIES, HEALTH, codesFromUser } from "@/lib/health";
import HealthPicker from "@/components/HealthPicker";
import MatchRing, { RING_TONES } from "@/components/MatchRing";
import { EmptyState, ProductGrid, ProductRail } from "@/components/ProductCard";
import WantCard from "@/components/WantCard";

export const dynamic = "force-dynamic";

function SectionHead({ title, sub, href }: { title: string; sub?: string; href?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-extrabold tracking-[-0.02em] text-bark-900 sm:text-2xl">{title}</h2>
        {sub && <p className="mt-0.5 text-sm text-bark-500">{sub}</p>}
      </div>
      {href && (
        <Link href={href} className="shrink-0 rounded-xl px-3 py-1.5 text-sm font-bold text-forest-700 hover:bg-forest-50">
          전체보기
        </Link>
      )}
    </div>
  );
}

export default async function Home() {
  const user = await getCurrentUser();
  const myCodes = codesFromUser(user);
  const month = new Date().getMonth() + 1;

  const [latest, picks, sellerCount, productCount, regionRows, catCounts, seasonal] = await Promise.all([
    listProducts({ take: 8 }),
    recommend(myCodes, 12),
    prisma.user.count({ where: { role: { in: ["SELLER", "BOTH"] } } }),
    prisma.product.count({ where: { quantity: { gt: 0 }, hidden: false } }),
    prisma.product.findMany({ where: { region: { not: null }, hidden: false }, select: { region: true }, distinct: ["region"] }),
    Promise.all(CATEGORIES.map((c) => prisma.product.count({ where: { hidden: false, quantity: { gt: 0 }, plant: { category: c.code } } }))),
    prisma.seasonality.findMany({ include: { plant: { select: { commonName: true } } } }),
  ]);
  const wants = await prisma.wantRequest.findMany({
    where: { status: "OPEN" },
    include: { buyer: { select: { name: true } }, _count: { select: { offers: true, targets: true } } },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const inSeason = Array.from(
    new Set(
      seasonal
        .filter((s) => (s.startMonth <= s.endMonth ? month >= s.startMonth && month <= s.endMonth : month >= s.startMonth || month <= s.endMonth))
        .map((s) => s.plant.commonName),
    ),
  ).slice(0, 4);

  const perCode = myCodes.map((code) => ({ code, n: picks.filter((p) => p.matched.includes(code)).length }));
  const maxN = Math.max(1, ...perCode.map((x) => x.n));
  const name = user?.name ?? "회원";

  return (
    <>
      {/* ── 대시보드 히어로 ───────────────────── */}
      <section className="mesh">
        <div className="container-x pb-10 pt-8 sm:pt-12">
          <p className="rise text-sm font-bold text-forest-700">{user ? `안녕하세요, ${name}님 👋` : "반가워요 👋"}</p>
          <h1 className="rise mt-2 text-[28px] font-extrabold leading-[1.25] tracking-[-0.03em] text-bark-900 sm:text-[40px]">
            {user && myCodes.length ? (
              <>
                오늘 {name}님 몸에 맞는
                <br />
                자연산을 골라봤어요
              </>
            ) : (
              <>
                내 몸에 맞는 <span className="text-forest-700">진짜 자연산</span>,
                <br />
                골라드릴게요
              </>
            )}
          </h1>

          <div className="mt-7 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
            {/* 건강 매칭 카드 */}
            <div className="rise rounded-[2rem] bg-white p-5 shadow-[var(--shadow-lift)] ring-1 ring-white sm:p-7 [animation-delay:.08s]">
              {user && myCodes.length ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-bark-400">내 건강 매칭</p>
                      <p className="mt-1 text-lg font-extrabold text-bark-900">
                        맞춤 상품 <span className="text-forest-700">{picks.length}개</span>를 찾았어요
                      </p>
                    </div>
                    <Link href="/me" className="rounded-xl bg-hanji-100 px-3 py-2 text-xs font-bold text-bark-700 hover:bg-hanji-200">
                      건강상태 변경
                    </Link>
                  </div>
                  <div className="no-scrollbar mt-5 flex gap-3 overflow-x-auto pb-1">
                    {perCode.map((x, i) => {
                      const h = HEALTH.find((h) => h.code === x.code)!;
                      return (
                        <Link key={x.code} href={`/products?c=${x.code}`} className="flex min-w-[92px] flex-col items-center gap-2 rounded-2xl bg-hanji-50 px-3 py-4 transition hover:bg-forest-50">
                          <MatchRing value={(x.n / maxN) * 100} size={56} stroke={6} label={`${x.n}`} tone={RING_TONES[i % RING_TONES.length]} />
                          <span className="text-xs font-bold text-bark-700">
                            {h.emoji} {h.label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                  <Link href="/match" className="btn-primary mt-5 w-full">
                    맞춤 상품 전체 보기
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-xs font-bold text-bark-400">건강 매칭</p>
                  <p className="mb-4 mt-1 text-lg font-extrabold text-bark-900">요즘 어디가 신경 쓰이세요?</p>
                  <HealthPicker initial={myCodes} loggedIn={!!user} compact />
                </>
              )}
            </div>

            {/* 요약 타일 */}
            <div className="rise grid grid-cols-2 gap-3 [animation-delay:.16s]">
              <div className="col-span-2 rounded-[2rem] bg-gradient-to-br from-forest-600 to-forest-800 p-5 text-white shadow-[var(--shadow-card)]">
                <p className="text-xs font-bold text-white/80">🗓 {month}월 제철</p>
                <p className="mt-1.5 text-xl font-extrabold leading-snug">{inSeason.length ? inSeason.join(" · ") : "제철 정보 준비 중"}</p>
                <Link href="/products?sort=harvest" className="mt-3 inline-block rounded-xl bg-white/20 px-3 py-1.5 text-xs font-bold backdrop-blur hover:bg-white/30">
                  최근 채취순 보기 →
                </Link>
              </div>
              {[
                [sellerCount, "명", "산지 채취자", "bg-clay-50", "🧺"],
                [productCount, "종", "지금 판매 중", "bg-lilac-100", "🌿"],
                [regionRows.length, "곳", "채취 산지", "bg-butter-100", "⛰️"],
                [HEALTH.length, "가지", "건강 매칭 항목", "bg-sky2-100", "💚"],
              ].map(([n, u, l, bg, e]) => (
                <div key={l as string} className={`rounded-[1.5rem] p-4 ${bg}`}>
                  <p className="text-lg">{e}</p>
                  <p className="mt-1 text-2xl font-extrabold tracking-[-0.02em] text-bark-900">
                    {n}
                    <span className="ml-0.5 text-sm font-bold text-bark-500">{u}</span>
                  </p>
                  <p className="text-[11px] font-semibold text-bark-500">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 맞춤 추천 레일 ───────────────────── */}
      {picks.length > 0 && (
        <section className="container-x mt-10">
          <SectionHead title={`${name}님 맞춤 추천`} sub="여러 건강상태에 함께 맞는 것부터 보여드려요" href="/match" />
          <ProductRail items={picks} highlight={myCodes} />
        </section>
      )}

      {/* ── 카테고리 ───────────────────────── */}
      <section className="container-x mt-10">
        <SectionHead title="무엇을 찾으세요?" />
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          {CATEGORIES.map((c, i) => (
            <Link key={c.code} href={`/products?category=${c.code}`} className={`group flex flex-col items-center gap-2 rounded-[1.5rem] ${c.tint} px-2 py-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] sm:flex-row sm:justify-start sm:gap-4 sm:px-5`}>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-2xl shadow-sm transition group-hover:scale-110">{c.emoji}</span>
              <span className="text-center sm:text-left">
                <span className="block text-[13px] font-extrabold text-bark-900 sm:text-base">{c.label}</span>
                <span className="block text-[11px] font-semibold text-bark-500">{catCounts[i]}개</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 최신 상품 ───────────────────────── */}
      <section className="container-x mt-12">
        <SectionHead title="방금 산에서 내려왔어요" sub="채취일이 가까운 순서예요" href="/products?sort=harvest" />
        {latest.length ? <ProductGrid items={latest} highlight={myCodes} /> : <EmptyState title="아직 등록된 상품이 없어요" desc="채취자들이 곧 첫 수확을 올려드릴 거예요." />}
      </section>

      {/* ── 구해요 ───────────────────────── */}
      <section className="container-x mt-12">
        <SectionHead title="🙋 이웃들이 찾고 있어요" sub="찾는 품목이 없다면 구해요를 올려보세요. 팔아본 채취자에게 먼저 알려드려요." href="/wants" />
        <div className="grid gap-3 md:grid-cols-3">
          {wants.map((w) => <WantCard key={w.id} w={w} />)}
          <Link href={user ? "/wants/new" : "/login?next=/wants/new"} className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-[1.5rem] border-2 border-dashed border-forest-300 bg-forest-50/50 p-5 text-center transition hover:bg-forest-50">
            <span className="text-3xl">🙋</span>
            <span className="font-extrabold text-forest-800">나도 구해요 올리기</span>
            <span className="text-xs text-bark-500">예: 송이버섯 1kg, 추석 전까지</span>
          </Link>
        </div>
      </section>

      {/* ── 이용 방법 ───────────────────────── */}
      <section className="container-x mt-16">
        <SectionHead title="이렇게 이용해요" />
        <ol className="grid gap-3 md:grid-cols-3">
          {[
            ["💚", "건강상태 고르기", "당뇨·혈압·심장·관절 등 신경 쓰이는 항목을 골라요.", "bg-forest-50"],
            ["🔎", "맞춤 자연산 추천", "그 상태에 전통적으로 쓰여 온 나물·약초를 매칭률 순으로 보여드려요.", "bg-clay-50"],
            ["📦", "산지에서 바로 배송", "채취자가 손질해서 중간 유통 없이 바로 보내드려요.", "bg-lilac-100"],
          ].map(([e, t, d, bg], i) => (
            <li key={t} className={`flex gap-4 rounded-[1.75rem] ${bg} p-5`}>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-2xl shadow-sm">{e}</span>
              <div>
                <p className="text-[11px] font-extrabold text-bark-400">STEP {i + 1}</p>
                <h3 className="font-extrabold text-bark-900">{t}</h3>
                <p className="mt-1 text-sm leading-relaxed text-bark-500">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── 채취자 모집 ─────────────────────── */}
      <section className="container-x mt-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-clay-100 via-clay-50 to-lilac-100 p-6 sm:p-8">
          <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-bold text-clay-700">채취자 모집</p>
              <h2 className="mt-1 text-xl font-extrabold tracking-[-0.02em] text-bark-900 sm:text-2xl">산을 잘 아신다면, 직접 캔 것을 팔아보세요</h2>
              <p className="mt-1 text-sm text-bark-500">사진과 채취 정보만 올리면 필요한 분께 바로 연결해 드려요.</p>
            </div>
            <Link href="/register?role=SELLER" className="btn-accent shrink-0">
              채취자로 시작하기
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
