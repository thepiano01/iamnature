import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { adminPage } from "@/lib/auth";
import { codesFromUser, labelOf } from "@/lib/health";
import { ymd } from "@/lib/format";
import ActionButton from "@/components/admin/ActionButton";
import RoleSelect from "@/components/admin/RoleSelect";
import { Badge, PageHead, SearchBox, Table, Tabs } from "@/components/admin/ui";

export const metadata: Metadata = { title: "회원 관리" };
export const dynamic = "force-dynamic";

const ROLE_FILTER: Record<string, Prisma.UserWhereInput> = {
  buyer: { role: "BUYER" },
  seller: { role: { in: ["SELLER", "BOTH"] } },
  admin: { role: "ADMIN" },
  suspended: { suspended: true },
};

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ r?: string; q?: string }> }) {
  const me = await adminPage();
  const { r = "", q } = await searchParams;
  const where: Prisma.UserWhereInput = {
    AND: [ROLE_FILTER[r] ?? {}, q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }] } : {}],
  };
  const [total, counts, users] = await Promise.all([
    prisma.user.count(),
    Promise.all(Object.values(ROLE_FILTER).map((w) => prisma.user.count({ where: w }))),
    prisma.user.findMany({
      where,
      include: { sellerProfile: { select: { farmName: true, verified: true } }, _count: { select: { orders: true, products: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  return (
    <>
      <PageHead eyebrow="Users" title="회원 관리" desc="역할을 바꾸거나 문제가 있는 계정을 이용정지할 수 있어요." />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          base={`/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`}
          active={r ? `r=${r}` : ""}
          tabs={[
            ["", "전체", total],
            ["r=buyer", "구매자", counts[0]],
            ["r=seller", "채취자", counts[1]],
            ["r=admin", "관리자", counts[2]],
            ["r=suspended", "정지", counts[3]],
          ]}
        />
        <SearchBox action="/admin/users" q={q} placeholder="이름·이메일·연락처" hidden={{ r }} />
      </div>
      <Table head={["회원", "역할", "건강상태", "주문", "상품", "가입일", "관리"]}>
        {users.map((u) => {
          const codes = codesFromUser(u);
          const self = u.id === me.id;
          return (
            <tr key={u.id} className={u.suspended ? "bg-rose-50/50" : ""}>
              <td className="px-4 py-3">
                <p className="font-semibold">
                  {u.name || "-"} {self && <Badge tone="dark">나</Badge>} {u.suspended && <Badge tone="rose">정지</Badge>}
                </p>
                <p className="text-xs text-bark-400">{u.email}</p>
                {u.sellerProfile?.farmName && (
                  <p className="text-xs text-forest-700">
                    {u.sellerProfile.farmName} {u.sellerProfile.verified && "✓"}
                  </p>
                )}
              </td>
              <td className="px-4 py-3"><RoleSelect id={u.id} role={u.role} disabled={self} /></td>
              <td className="px-4 py-3 text-xs text-bark-500">{codes.length ? codes.map(labelOf).join(", ") : "-"}</td>
              <td className="px-4 py-3">{u._count.orders}</td>
              <td className="px-4 py-3">{u._count.products}</td>
              <td className="whitespace-nowrap px-4 py-3 text-xs text-bark-500">{ymd(u.createdAt)}</td>
              <td className="px-4 py-3">
                {!self &&
                  (u.suspended ? (
                    <ActionButton url={`/api/admin/users/${u.id}`} body={{ suspended: false }} label="정지 해제" />
                  ) : (
                    <ActionButton url={`/api/admin/users/${u.id}`} body={{ suspended: true }} label="이용정지" className="btn-sm rounded-full px-3 text-xs text-bark-400 hover:text-rose-600" confirm={`${u.name || u.email} 계정을 이용정지할까요? 즉시 로그인이 막힙니다.`} />
                  ))}
              </td>
            </tr>
          );
        })}
      </Table>
      {users.length === 200 && <p className="text-xs text-bark-400">최근 200명까지 표시합니다. 검색으로 좁혀 보세요.</p>}
    </>
  );
}
