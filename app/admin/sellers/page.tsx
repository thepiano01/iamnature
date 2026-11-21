import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ymd } from "@/lib/format";
import ActionButton from "@/components/admin/ActionButton";
import { Badge, PageHead, SearchBox, Tabs } from "@/components/admin/ui";
import { EmptyState } from "@/components/ProductCard";

export const metadata: Metadata = { title: "채취자 인증" };
export const dynamic = "force-dynamic";

const hasDocs: Prisma.SellerProfileWhereInput = { OR: [{ permitImage: { not: null } }, { idCardImage: { not: null } }] };
const FILTERS: Record<string, Prisma.SellerProfileWhereInput> = {
  pending: { verified: false, rejectReason: null, ...hasDocs },
  approved: { verified: true },
  rejected: { verified: false, rejectReason: { not: null } },
  none: { verified: false, permitImage: null, idCardImage: null },
};

function Doc({ label, src }: { label: string; src: string | null }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold text-bark-500">{label}</p>
      {src ? (
        <a href={src} target="_blank" rel="noreferrer" className="block aspect-[4/3] overflow-hidden rounded-xl ring-1 ring-hanji-200 hover:ring-forest-600" title="새 창에서 크게 보기">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={label} className="h-full w-full object-cover" />
        </a>
      ) : (
        <div className="grid aspect-[4/3] place-items-center rounded-xl bg-hanji-100 text-xs text-bark-400">미제출</div>
      )}
    </div>
  );
}

export default async function AdminSellers({ searchParams }: { searchParams: Promise<{ s?: string; q?: string }> }) {
  const { s = "pending", q } = await searchParams;
  const search: Prisma.SellerProfileWhereInput = q
    ? { OR: [{ farmName: { contains: q } }, { user: { name: { contains: q } } }, { user: { email: { contains: q } } }] }
    : {};
  const [counts, list] = await Promise.all([
    Promise.all(Object.values(FILTERS).map((w) => prisma.sellerProfile.count({ where: w }))),
    prisma.sellerProfile.findMany({
      where: { AND: [FILTERS[s] ?? FILTERS.pending, search] },
      include: { user: { select: { id: true, name: true, email: true, createdAt: true, phone: true, _count: { select: { products: true } } } } },
      orderBy: { updatedAt: s === "pending" ? "asc" : "desc" },
    }),
  ]);

  return (
    <>
      <PageHead eyebrow="Sellers" title="채취자 인증 심사" desc="서류를 확인하고 승인하면 상품에 ‘인증 채취자’ 배지가 붙습니다." />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          base={`/admin/sellers${q ? `?q=${encodeURIComponent(q)}` : ""}`}
          active={`s=${s}`}
          tabs={[
            ["s=pending", "심사 대기", counts[0]],
            ["s=approved", "승인", counts[1]],
            ["s=rejected", "반려", counts[2]],
            ["s=none", "서류 미제출", counts[3]],
          ]}
        />
        <SearchBox action="/admin/sellers" q={q} placeholder="이름·이메일·채취자명" hidden={{ s }} />
      </div>

      {!list.length ? (
        <EmptyState title={s === "pending" ? "심사 대기 중인 채취자가 없어요" : "해당하는 채취자가 없어요"} />
      ) : (
        <ul className="space-y-4">
          {list.map((sp) => (
            <li key={sp.id} className="card grid gap-5 p-5 md:grid-cols-[1fr_320px]">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-serif text-lg font-bold">{sp.farmName || "(채취자명 없음)"}</p>
                  {sp.verified ? <Badge tone="green">승인</Badge> : sp.rejectReason ? <Badge tone="rose">반려</Badge> : sp.permitImage || sp.idCardImage ? <Badge tone="amber">심사 대기</Badge> : <Badge tone="stone">미제출</Badge>}
                </div>
                <dl className="grid grid-cols-[90px_1fr] gap-y-1.5 text-sm">
                  <dt className="text-bark-400">이름</dt><dd>{sp.user.name}</dd>
                  <dt className="text-bark-400">이메일</dt><dd>{sp.user.email}</dd>
                  <dt className="text-bark-400">연락처</dt><dd>{sp.user.phone || "-"}</dd>
                  <dt className="text-bark-400">사업자번호</dt><dd>{sp.businessNumber || "-"}</dd>
                  <dt className="text-bark-400">가입일</dt><dd>{ymd(sp.user.createdAt)}</dd>
                  <dt className="text-bark-400">등록 상품</dt><dd>{sp.user._count.products}개</dd>
                  {sp.reviewedAt && (<><dt className="text-bark-400">심사일</dt><dd>{ymd(sp.reviewedAt)}</dd></>)}
                </dl>
                {sp.rejectReason && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">반려 사유: {sp.rejectReason}</p>}
                <div className="flex flex-wrap gap-2 pt-1">
                  {!sp.verified && (
                    <ActionButton url={`/api/admin/sellers/${sp.userId}`} body={{ action: "approve" }} label="승인" className="btn-primary btn-sm" confirm={`${sp.farmName || sp.user.name}님을 인증 채취자로 승인할까요?`} />
                  )}
                  {!sp.verified && (
                    <ActionButton url={`/api/admin/sellers/${sp.userId}`} body={{ action: "reject" }} label="반려" className="btn-ghost btn-sm" askReason="반려 사유를 입력하세요 (채취자에게 보여집니다)" />
                  )}
                  {sp.verified && (
                    <ActionButton url={`/api/admin/sellers/${sp.userId}`} body={{ action: "revoke" }} label="인증 취소" className="btn-ghost btn-sm" confirm="인증을 취소할까요? 상품의 인증 배지가 사라집니다." />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Doc label="영업신고증·채취허가" src={sp.permitImage} />
                <Doc label="신분증" src={sp.idCardImage} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
