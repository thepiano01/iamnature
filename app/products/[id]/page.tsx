import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { categoryLabel, codesFromUser } from "@/lib/health";
import { listProducts } from "@/lib/products";
import { daysAgo, won, ymd } from "@/lib/format";
import Gallery from "@/components/Gallery";
import BuyBox from "@/components/BuyBox";
import { ProductGrid } from "@/components/ProductCard";
import MatchRing from "@/components/MatchRing";
import { creditOf } from "@/lib/credits";
import { sellerStats } from "@/lib/sellerStats";
import { summarize } from "@/lib/reviews";
import TrustTemp, { Stars } from "@/components/TrustTemp";
import ReviewList, { PraiseTags, RatingSummary } from "@/components/ReviewList";

export const dynamic = "force-dynamic";

async function load(id: number) {
  if (!id) return null;
  return prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: [{ isPrimary: "desc" }, { id: "asc" }] },
      seller: { select: { id: true, name: true, sellerProfile: { select: { farmName: true, verified: true } }, _count: { select: { products: true } } } },
      plant: {
        include: {
          conditions: { include: { condition: true }, orderBy: { confidenceScore: "desc" } },
          preparations: true,
          safeties: true,
          videos: true,
          seasons: true,
          sources: { include: { source: true } },
        },
      },
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const p = await load(Number((await params).id));
  return { title: p?.title ?? "상품" };
}

const EVIDENCE: Record<string, [string, string]> = {
  folk: ["전통·민간", "bg-amber-50 text-amber-800 ring-amber-200"],
  study: ["연구 보고", "bg-forest-50 text-forest-800 ring-forest-100"],
  extract: ["추출물 연구", "bg-sky-50 text-sky-800 ring-sky-200"],
  mixed: ["혼합 근거", "bg-stone-50 text-stone-700 ring-stone-200"],
};

function Block({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-32 border-t border-hanji-200 py-10">
      <h2 className="h-serif mb-5 text-xl sm:text-2xl">{title}</h2>
      {children}
    </section>
  );
}

function Prose({ text }: { text?: string | null }) {
  if (!text) return null;
  return <div className="whitespace-pre-line text-[15px] leading-[1.85] text-bark-700">{text}</div>;
}

function ytEmbed(url: string) {
  const m = url.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const [p, user] = await Promise.all([load(id), getCurrentUser()]);
  if (!p) notFound();
  if (p.hidden && user?.id !== p.sellerId && user?.role !== "ADMIN") notFound();

  const [reviews, stats] = await Promise.all([
    prisma.review.findMany({ where: { productId: p.id, hidden: false }, include: { buyer: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 30 }),
    p.sellerId ? sellerStats(p.sellerId) : null,
  ]);
  const rs = summarize(reviews);
  const plant = p.plant;
  const myCodes = codesFromUser(user);
  const matched = plant?.conditions.filter((c) => myCodes.includes(c.condition.code as never)) ?? [];
  const images = p.images.length ? p.images.map((i) => i.url) : p.imageUrl ? [p.imageUrl] : [];
  const farm = p.seller?.sellerProfile?.farmName || p.seller?.name || "채취자";
  const related = plant
    ? (await listProducts({ take: 9 })).filter((x) => x.id !== p.id && x.plant?.category === plant.category).slice(0, 4)
    : [];

  const toc = [
    ["desc", "상품 설명"],
    ["reviews", `후기 ${rs.n}`],
    plant?.conditions.length ? ["health", "건강상태별 정보"] : null,
    plant?.healthyCookingTips || plant?.preparations.length ? ["cook", "손질·조리법"] : null,
    plant?.cautionsDetail || plant?.toxicitySummary || plant?.safeties.length ? ["caution", "주의사항"] : null,
    plant?.videos.length ? ["video", "영상"] : null,
  ].filter(Boolean) as [string, string][];

  const facts = [
    ["채취 산지", p.region],
    ["채취일", p.harvestDate ? `${ymd(p.harvestDate)} (${daysAgo(p.harvestDate)})` : null],
    ["상태", p.formState],
    ["판매 단위", p.unit],
    ["남은 수량", `${p.quantity}${p.unit}`],
    plant?.scientificName ? ["학명", plant.scientificName] : null,
  ].filter((x) => x && x[1]) as [string, string][];

  return (
    <div className="container-x pt-6 sm:pt-10">
      <nav className="mb-5 flex items-center gap-1.5 text-xs text-bark-400">
        <Link href="/products" className="hover:text-bark-700">전체 상품</Link>
        <span>›</span>
        <Link href={`/products?category=${plant?.category ?? ""}`} className="hover:text-bark-700">{categoryLabel(plant?.category)}</Link>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
        <Gallery images={images} title={p.title} category={plant?.category} credits={images.map(creditOf)} />

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-forest-50 px-2.5 py-1 font-semibold text-forest-800">{plant?.commonName ?? p.plantName ?? categoryLabel(plant?.category)}</span>
              {p.harvestDate && <span className="rounded-full bg-clay-50 px-2.5 py-1 font-semibold text-clay-700">{daysAgo(p.harvestDate)}</span>}
            </div>
            <h1 className="h-serif text-[26px] leading-snug sm:text-[32px]">{p.title}</h1>
            {rs.n > 0 && (
              <a href="#reviews" className="inline-flex items-center gap-1.5 text-sm">
                <Stars value={rs.avg} />
                <b className="text-bark-900">{rs.avg.toFixed(1)}</b>
                <span className="text-bark-400 underline">후기 {rs.n}개</span>
              </a>
            )}
            <p className="pt-1">
              <span className="text-3xl font-extrabold tracking-[-0.02em] text-bark-900">{won(p.price)}</span>
              <span className="ml-1.5 text-sm text-bark-500">/ {p.unit}</span>
            </p>
          </div>

          {matched.length > 0 && (
            <div className="flex gap-4 rounded-[1.5rem] bg-gradient-to-br from-clay-50 to-forest-50 p-4">
              <MatchRing value={(matched.length / Math.max(1, myCodes.length)) * 100} size={60} stroke={6} tone="peach" />
              <div className="min-w-0">
              <p className="text-sm font-extrabold text-bark-900">내 건강상태 {myCodes.length}개 중 {matched.length}개와 맞아요</p>
              <ul className="mt-2 space-y-1.5 text-sm text-bark-700">
                {matched.map((m) => (
                  <li key={m.id}>
                    <b className="text-clay-700">{m.condition.name}</b> — {m.efficacySummary || m.note || "전통적으로 함께 이야기되어 온 식재료예요."}
                  </li>
                ))}
              </ul>
              </div>
            </div>
          )}

          <dl className="grid grid-cols-[88px_1fr] gap-y-2.5 rounded-[1.5rem] bg-white p-4 text-sm ring-1 ring-hanji-200/70">
            {facts.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-bark-400">{k}</dt>
                <dd className="font-medium text-bark-900">{v}</dd>
              </div>
            ))}
          </dl>

          <BuyBox productId={p.id} price={p.price} unit={p.unit} stock={p.quantity} loggedIn={!!user} own={!!user && user.id === p.sellerId} />

          <Link href={`/sellers/${p.sellerId}`} className="flex items-center gap-3 rounded-[1.5rem] bg-white p-4 ring-1 ring-hanji-200 transition hover:ring-forest-600">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-forest-500 to-forest-800 text-lg font-extrabold text-white">{farm.slice(0, 1)}</div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 font-semibold text-bark-900">
                <span className="truncate">{farm}</span>
                {p.seller?.sellerProfile?.verified && <span className="shrink-0 rounded-full bg-forest-100 px-2 py-0.5 text-[10px] font-bold text-forest-800">인증 채취자</span>}
              </p>
              <p className="text-xs text-bark-500">
                거래 {stats?.completed ?? 0}회 · 후기 {stats?.n ?? 0}개 · 상품 {p.seller?._count.products ?? 0}개
              </p>
            </div>
            {stats && <TrustTemp temp={stats.temp} size="sm" />}
          </Link>
        </div>
      </div>

      {/* 상세 탭 */}
      <div className="sticky top-16 z-20 -mx-4 mt-12 border-b border-hanji-200 bg-hanji-50/95 px-4 backdrop-blur sm:mx-0 sm:px-0">
        <div className="no-scrollbar flex gap-6 overflow-x-auto">
          {toc.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="shrink-0 border-b-2 border-transparent py-3.5 text-sm font-semibold text-bark-500 hover:border-forest-700 hover:text-forest-900">{label}</a>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-3xl">
        <Block id="desc" title="상품 설명">
          <div className="space-y-6">
            <Prose text={p.description || "채취자가 아직 상세 설명을 작성하지 않았어요."} />
            {plant && (plant.generalDescription || plant.folkUsageSummary || plant.effectsDetail) && (
              <div className="paper space-y-3 rounded-[1.75rem] p-5">
                <p className="text-lg font-extrabold text-bark-900">🌿 {plant.commonName}은(는)요</p>
                <Prose text={plant.generalDescription} />
                <Prose text={plant.folkUsageSummary} />
                <Prose text={plant.effectsDetail} />
              </div>
            )}
            {plant?.seasons.length ? (
              <div>
                <p className="mb-2 text-sm font-semibold text-bark-700">제철</p>
                <div className="grid grid-cols-12 gap-1">
                  {Array.from({ length: 12 }, (_, m) => {
                    const on = plant.seasons.some((s) => (s.startMonth <= s.endMonth ? m + 1 >= s.startMonth && m + 1 <= s.endMonth : m + 1 >= s.startMonth || m + 1 <= s.endMonth));
                    return (
                      <div key={m} className={`rounded-md py-1.5 text-center text-[10px] font-semibold ${on ? "bg-forest-600 text-white" : "bg-hanji-100 text-bark-400"}`}>{m + 1}월</div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </Block>

        <Block id="reviews" title={`구매 후기 ${rs.n}`}>
          <div className="space-y-5">
            {rs.n > 0 && <RatingSummary avg={rs.avg} n={rs.n} dist={rs.dist} />}
            {rs.goodTags.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-bold text-bark-700">구매자들이 꼽은 장점</p>
                <PraiseTags tags={rs.goodTags} />
              </div>
            )}
            <ReviewList reviews={reviews} />
          </div>
        </Block>

        {plant?.conditions.length ? (
          <Block id="health" title="어떤 건강상태와 함께 이야기될까요?">
            <div className="grid gap-3 sm:grid-cols-2">
              {plant.conditions.map((c) => {
                const ev = EVIDENCE[(c.evidenceLevel || "").toLowerCase()] ?? ["참고", "bg-stone-50 text-stone-700 ring-stone-200"];
                const mine = myCodes.includes(c.condition.code as never);
                return (
                  <div key={c.id} className={`rounded-2xl border p-4 ${mine ? "border-clay-500/40 bg-clay-50" : "border-hanji-200 bg-white"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-bark-900">
                        {c.condition.name}
                        {mine && <span className="ml-1.5 text-xs text-clay-600">· 내 건강상태</span>}
                      </p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${ev[1]}`}>{ev[0]}</span>
                    </div>
                    {(c.efficacySummary || c.note) && <p className="mt-2 text-sm leading-relaxed text-bark-700">{c.efficacySummary || c.note}</p>}
                    {c.usageNote && <p className="mt-2 text-xs text-bark-500">먹는 법 · {c.usageNote}</p>}
                  </div>
                );
              })}
            </div>
          </Block>
        ) : null}

        {plant?.healthyCookingTips || plant?.preparations.length ? (
          <Block id="cook" title="손질·조리법">
            <Prose text={plant?.healthyCookingTips} />
            {plant?.preparations.length ? (
              <ol className="mt-5 space-y-3">
                {plant.preparations.map((m, i) => (
                  <li key={m.id} className="flex gap-4 rounded-2xl border border-hanji-200 bg-white p-4">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-forest-50 text-sm font-extrabold text-forest-700">{i + 1}</span>
                    <div className="space-y-1">
                      <p className="font-semibold text-bark-900">{m.title}</p>
                      {m.description && <p className="text-sm leading-relaxed text-bark-700">{m.description}</p>}
                      {(m.dosage || m.frequency) && <p className="text-xs text-bark-500">{[m.dosage, m.frequency].filter(Boolean).join(" · ")}</p>}
                      {m.caution && <p className="text-xs text-clay-700">⚠ {m.caution}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            ) : null}
          </Block>
        ) : null}

        {plant?.cautionsDetail || plant?.toxicitySummary || plant?.safeties.length ? (
          <Block id="caution" title="주의사항">
            <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
              <Prose text={plant?.cautionsDetail} />
              <Prose text={plant?.toxicitySummary} />
              {plant?.safeties.map((s) => (
                <div key={s.id} className="text-sm text-bark-700">
                  <b>{s.toxicPart ? `${s.toxicPart} · ` : ""}{s.toxicityLevel}</b>
                  {s.symptoms && <p>증상: {s.symptoms}</p>}
                  {s.contraindications && <p>피해야 할 경우: {s.contraindications}</p>}
                  {s.maxDoseNote && <p>섭취량: {s.maxDoseNote}</p>}
                </div>
              ))}
            </div>
          </Block>
        ) : null}

        {plant?.videos.length ? (
          <Block id="video" title="영상으로 보기">
            <div className="grid gap-4 sm:grid-cols-2">
              {plant.videos.map((v) => {
                const src = ytEmbed(v.url);
                return (
                  <div key={v.id} className="overflow-hidden rounded-2xl border border-hanji-200 bg-white">
                    {src ? (
                      <iframe src={src} title={v.title} className="aspect-video w-full" allowFullScreen loading="lazy" />
                    ) : (
                      <a href={v.url} target="_blank" rel="noreferrer" className="block aspect-video bg-forest-900" />
                    )}
                    <p className="p-3 text-sm font-medium text-bark-900">{v.title}</p>
                  </div>
                );
              })}
            </div>
          </Block>
        ) : null}

        <p className="rounded-xl bg-hanji-100 px-4 py-3 text-xs leading-relaxed text-bark-500">
          ※ 자연 식재료이며 의약품이 아닙니다. 위 정보는 전통적 쓰임과 공개된 자료를 정리한 참고용이며, 질병의 예방·치료를 보장하지 않습니다. 복용 중인 약이 있거나 임신·수유 중이라면 섭취 전 전문의와 상담하세요.
        </p>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="h-serif mb-5 text-2xl">함께 보면 좋은 {categoryLabel(plant?.category)}</h2>
          <ProductGrid items={related} highlight={myCodes} />
        </section>
      )}
    </div>
  );
}

