import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { codesFromUser, HEALTH, labelOf, parseCodes } from "@/lib/health";
import { recommend } from "@/lib/products";
import HealthPicker from "@/components/HealthPicker";
import { EmptyState, ProductGrid } from "@/components/ProductCard";

export const metadata: Metadata = { title: "건강 매칭" };
export const dynamic = "force-dynamic";

export default async function MatchPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const fromQuery = parseCodes(sp.c);
  const codes = fromQuery.length ? fromQuery : codesFromUser(user);
  const results = await recommend(codes, 80);
  const multi = codes.length > 1 ? results.filter((r) => r.matched.length > 1) : [];

  return (
    <div>
      <section className="mesh">
        <div className="container-x grid gap-8 py-10 md:grid-cols-[1fr_1.3fr] md:py-14">
          <div>
            <p className="text-sm font-bold text-forest-700">💚 건강 매칭</p>
            <h1 className="h-serif mt-2 text-3xl leading-tight sm:text-4xl">
              내 몸에 맞는
              <br />
              자연산 찾기
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-bark-500">
              신경 쓰이는 건강상태를 고르면, 그 상태에 전통적으로 쓰여 온 나물·약초를 겹치는 항목이 많은 순서로 보여드려요.
            </p>
            {!user && (
              <p className="mt-4 text-xs text-bark-500">
                <Link href="/login?next=/match" className="font-semibold text-forest-700 underline">로그인</Link>하면 선택이 저장되어 다음에도 바로 추천받을 수 있어요.
              </p>
            )}
          </div>
          <div className="rounded-[2rem] bg-white p-5 shadow-[var(--shadow-lift)] sm:p-6">
            <HealthPicker key={codes.join()} initial={codes} loggedIn={!!user} compact submitLabel={user ? "저장하고 다시 찾기" : "이 조건으로 찾기"} />
          </div>
        </div>
      </section>

      <div className="container-x space-y-14 pt-10">
        {!codes.length ? (
          <EmptyState title="건강상태를 하나 이상 골라주세요" desc="당뇨, 혈압, 심장, 관절 등 해당하는 항목을 선택하면 맞춤 상품이 나타나요." />
        ) : !results.length ? (
          <EmptyState title="아직 매칭되는 상품이 없어요" desc={`${codes.map(labelOf).join(", ")}에 맞는 상품을 채취자들이 준비 중이에요.`} action={<Link href="/products" className="btn-ghost btn-sm">전체 상품 둘러보기</Link>} />
        ) : (
          <>
            {multi.length > 0 && (
              <section>
                <div className="mb-5">
                  <span className="rounded-full bg-clay-500 px-3 py-1 text-xs font-bold text-white">🏆 BEST MATCH</span>
                  <h2 className="h-serif mt-3 text-2xl">여러 건강상태에 함께 맞는 것</h2>
                </div>
                <ProductGrid items={multi} highlight={codes} />
              </section>
            )}
            {HEALTH.filter((h) => codes.includes(h.code)).map((h) => {
              const items = results.filter((r) => r.matched.includes(h.code));
              return (
                <section key={h.code}>
                  <div className="mb-5 flex items-end justify-between">
                    <h2 className="h-serif text-2xl">
                      {h.emoji} <span className="text-forest-700">{h.label}</span> 관리에 쓰여 온 것
                    </h2>
                    <Link href={`/products?c=${h.code}`} className="text-sm font-semibold text-forest-700 hover:underline">더보기 →</Link>
                  </div>
                  {items.length ? <ProductGrid items={items.slice(0, 8)} highlight={codes} /> : <p className="text-sm text-bark-500">아직 등록된 상품이 없어요.</p>}
                </section>
              );
            })}
          </>
        )}
        <p className="rounded-xl bg-hanji-100 px-4 py-3 text-xs leading-relaxed text-bark-500">
          ※ 건강 매칭은 전통적 쓰임과 공개 자료를 바탕으로 한 식재료 안내이며, 진단이나 치료를 대신하지 않습니다. 치료 중인 질환이 있다면 섭취 전 담당 의사와 상의하세요.
        </p>
      </div>
    </div>
  );
}
