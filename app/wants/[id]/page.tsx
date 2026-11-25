import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser, isSellerRole } from "@/lib/auth";
import { WANT_REASON, WANT_STATUS } from "@/lib/wants";
import { sellerStats } from "@/lib/sellerStats";
import { timeAgo, won, ymd } from "@/lib/format";
import { maskName } from "@/lib/reviews";
import TrustTemp from "@/components/TrustTemp";
import ActionButton from "@/components/admin/ActionButton";
import { OfferForm, AttachProduct } from "./OfferClient";

export const dynamic = "force-dynamic";

async function load(id: number) {
  if (!id) return null;
  return prisma.wantRequest.findUnique({
    where: { id },
    include: {
      buyer: { select: { id: true, name: true } },
      targets: { select: { sellerId: true, reason: true } },
      offers: {
        include: {
          seller: { select: { id: true, name: true, sellerProfile: { select: { farmName: true, verified: true } } } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const w = await load(Number((await params).id));
  return { title: w ? `${w.keyword} 구해요` : "구해요" };
}

export default async function WantDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ sent?: string }> }) {
  const w = await load(Number((await params).id));
  if (!w) notFound();
  const { sent } = await searchParams;
  const me = await getCurrentUser();
  const isOwner = me?.id === w.buyerId;
  const isSeller = !!me && isSellerRole(me.role) && !isOwner;
  const myTarget = isSeller ? w.targets.find((t) => t.sellerId === me!.id) : null;
  const myOffer = isSeller ? w.offers.find((o) => o.sellerId === me!.id) : null;
  const st = WANT_STATUS[w.status] ?? WANT_STATUS.OPEN;

  const productIds = w.offers.map((o) => o.productId).filter(Boolean) as number[];
  const [products, myProducts, statsList] = await Promise.all([
    prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, title: true, price: true, unit: true, quantity: true } }),
    isSeller ? prisma.product.findMany({ where: { sellerId: me!.id, hidden: false }, select: { id: true, title: true, price: true, unit: true }, orderBy: { createdAt: "desc" } }) : [],
    isOwner ? Promise.all(w.offers.map((o) => sellerStats(o.sellerId))) : [],
  ]);
  const productOf = (id: number | null) => products.find((p) => p.id === id);
  const reasonCount = (r: string) => w.targets.filter((t) => t.reason === r).length;

  return (
    <div className="container-x max-w-3xl space-y-5 pt-8 sm:pt-12">
      <Link href="/wants" className="text-xs text-bark-400 hover:text-bark-700">← 구해요</Link>

      {sent !== undefined && isOwner && (
        <div className="rounded-[1.5rem] bg-gradient-to-r from-forest-50 to-clay-50 p-5">
          {Number(sent) > 0 ? (
            <>
              <p className="text-lg font-extrabold text-bark-900">📨 채취자 {sent}명에게 알림을 보냈어요</p>
              <p className="mt-1 text-sm text-bark-500">
                {[["SOLD", "판매 이력"], ["LISTING", "판매 중"], ["CATEGORY", "비슷한 품목"]]
                  .filter(([r]) => reasonCount(r))
                  .map(([r, l]) => `${l} ${reasonCount(r)}명`)
                  .join(" · ")}
                {" — 제안이 오면 알림으로 알려드릴게요."}
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-extrabold text-bark-900">📌 요청을 올렸어요</p>
              <p className="mt-1 text-sm text-bark-500">아직 이 품목을 다루는 채취자가 없어서 바로 알림을 보내진 못했어요. 구해요 게시판에서 다른 채취자들도 보고 제안할 수 있어요.</p>
            </>
          )}
        </div>
      )}

      {/* 요청 요약 */}
      <section className="rounded-[2rem] bg-white p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between">
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${st.tone}`}>{st.label}</span>
          <span className="text-xs text-bark-400">{maskName(w.buyer.name)} · {timeAgo(w.createdAt)}</span>
        </div>
        <h1 className="mt-3 text-2xl font-extrabold tracking-[-0.02em] text-bark-900 sm:text-3xl">
          🙋 {w.keyword} <span className="text-forest-700">{w.quantity}{w.unit}</span> 구해요
        </h1>
        <dl className="mt-4 grid grid-cols-[90px_1fr] gap-y-2 text-sm">
          <dt className="text-bark-400">희망 가격</dt><dd className="font-semibold">{w.budget ? `${won(w.budget)} / ${w.unit}` : "제안 받아볼게요"}</dd>
          <dt className="text-bark-400">필요한 날</dt><dd className="font-semibold">{w.neededBy ? `${ymd(w.neededBy)}까지` : "상관없어요"}</dd>
          <dt className="text-bark-400">받는 지역</dt><dd className="font-semibold">{w.region || "-"}</dd>
        </dl>
        {w.note && <p className="mt-4 whitespace-pre-line rounded-2xl bg-hanji-50 p-4 text-sm leading-relaxed text-bark-700">{w.note}</p>}
        <p className="mt-4 text-xs text-bark-400">맞춤 전달 {w.targets.length}명 · 받은 제안 {w.offers.length}개</p>
        {isOwner && (
          <div className="mt-4 flex gap-2">
            {w.status === "CLOSED" ? (
              <ActionButton url={`/api/wants/${w.id}`} body={{ action: "reopen" }} label="다시 찾기" />
            ) : (
              <ActionButton url={`/api/wants/${w.id}`} body={{ action: "close" }} label="요청 마감" confirm="이 요청을 마감할까요? 더 이상 제안을 받지 않아요." />
            )}
          </div>
        )}
      </section>

      {/* 구매자: 받은 제안 */}
      {isOwner && (
        <section className="space-y-3">
          <h2 className="text-lg font-extrabold text-bark-900">받은 제안 {w.offers.length}</h2>
          {!w.offers.length && <p className="rounded-2xl bg-hanji-100 p-6 text-center text-sm text-bark-500">아직 제안이 없어요. 채취자들이 확인하는 중이에요 🌱</p>}
          {w.offers.map((o, i) => {
            const farm = o.seller.sellerProfile?.farmName || o.seller.name || "채취자";
            const prod = productOf(o.productId);
            const stats = statsList[i];
            return (
              <article key={o.id} className={`rounded-[1.5rem] bg-white p-5 ring-1 ${o.status === "ACCEPTED" ? "ring-2 ring-forest-600" : o.status === "DECLINED" ? "opacity-50 ring-hanji-200" : "ring-hanji-200"}`}>
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/sellers/${o.sellerId}`} className="min-w-0">
                    <p className="flex items-center gap-1.5 font-bold text-bark-900">
                      {farm}
                      {o.seller.sellerProfile?.verified && <span className="rounded-full bg-forest-100 px-2 py-0.5 text-[10px] font-bold text-forest-800">✓ 인증</span>}
                    </p>
                    <p className="text-xs text-bark-400">
                      {w.targets.find((t) => t.sellerId === o.sellerId)?.reason === "SOLD" && "이 품목 판매 이력 · "}거래 {stats?.completed ?? 0}회 · 후기 {stats?.n ?? 0}개 · {timeAgo(o.createdAt)}
                    </p>
                  </Link>
                  {stats && <TrustTemp temp={stats.temp} size="sm" />}
                </div>
                <p className="mt-3 text-xl font-extrabold text-bark-900">
                  {won(o.price)}<span className="text-sm font-semibold text-bark-400"> / {o.unit}</span>
                  <span className="ml-2 text-sm font-bold text-forest-700">{o.quantity}{o.unit} 가능</span>
                </p>
                {o.message && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-bark-700">{o.message}</p>}
                {prod && (
                  <Link href={`/products/${prod.id}`} className="mt-3 flex items-center justify-between rounded-xl bg-hanji-50 px-3 py-2 text-sm hover:bg-forest-50">
                    <span className="truncate font-semibold">🛒 {prod.title}</span>
                    <span className="shrink-0 text-xs font-bold text-forest-700">상품 보기 →</span>
                  </Link>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {o.status === "SENT" && w.status === "OPEN" && (
                    <>
                      <ActionButton url={`/api/offers/${o.id}`} body={{ action: "accept" }} label="이 제안 수락" className="btn-primary btn-sm" confirm={`${farm}님의 제안을 수락할까요?`} />
                      <ActionButton url={`/api/offers/${o.id}`} body={{ action: "decline" }} label="거절" className="btn-sm rounded-full px-3 text-xs text-bark-400 hover:text-rose-600" />
                    </>
                  )}
                  {o.status === "ACCEPTED" &&
                    (prod ? (
                      <Link href={`/products/${prod.id}`} className="btn-accent btn-sm">바로 주문하기 →</Link>
                    ) : (
                      <span className="text-xs font-semibold text-forest-700">✓ 수락함 · 채취자가 상품을 올리면 알림으로 알려드릴게요</span>
                    ))}
                  {o.status === "DECLINED" && <span className="text-xs text-bark-400">거절한 제안</span>}
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* 채취자: 제안하기 */}
      {isSeller && (
        <section className="space-y-3">
          {myTarget && (
            <p className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${WANT_REASON[myTarget.reason]?.tone}`}>
              🎯 회원님께 맞춤 전달된 요청이에요 · {WANT_REASON[myTarget.reason]?.label}
            </p>
          )}
          {myOffer?.status === "ACCEPTED" ? (
            <div className="rounded-[1.5rem] bg-forest-50 p-5">
              <p className="font-extrabold text-forest-900">🎉 구매자가 제안을 수락했어요</p>
              {myOffer.productId ? (
                <p className="mt-1 text-sm text-forest-800">연결된 상품으로 주문이 들어오면 주문 관리에서 확인하세요.</p>
              ) : (
                <AttachProduct offerId={myOffer.id} products={myProducts} />
              )}
            </div>
          ) : w.status === "OPEN" ? (
            <OfferForm
              requestId={w.id}
              unit={w.unit}
              defaults={myOffer ? { price: myOffer.price, quantity: myOffer.quantity, message: myOffer.message ?? "", productId: myOffer.productId } : { price: w.budget ?? 0, quantity: w.quantity, message: "", productId: null }}
              products={myProducts}
              editing={!!myOffer}
            />
          ) : (
            <p className="rounded-2xl bg-hanji-100 p-5 text-center text-sm text-bark-500">마감된 요청이에요.</p>
          )}
        </section>
      )}

      {!me && (
        <div className="rounded-[1.5rem] bg-hanji-100 p-5 text-center text-sm text-bark-500">
          채취자이신가요? <Link href={`/login?next=/wants/${w.id}`} className="font-bold text-forest-700 underline">로그인</Link>하고 제안을 보내보세요.
        </div>
      )}
      {me && !isOwner && !isSeller && (
        <div className="rounded-[1.5rem] bg-hanji-100 p-5 text-center text-sm text-bark-500">
          나도 찾는 품목이 있나요? <Link href="/wants/new" className="font-bold text-forest-700 underline">구해요 올리기</Link>
        </div>
      )}
    </div>
  );
}
