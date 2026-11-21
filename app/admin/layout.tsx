import { adminPage } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AdminNav from "./AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await adminPage();
  const pending = await prisma.sellerProfile.count({
    where: { verified: false, rejectReason: null, OR: [{ permitImage: { not: null } }, { idCardImage: { not: null } }] },
  });
  return (
    <div className="container-x grid gap-6 pt-6 sm:pt-10 lg:grid-cols-[220px_1fr] lg:gap-10">
      <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
        <div className="rounded-2xl bg-bark-900 p-4 text-hanji-50">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-bark-400">ADMIN</p>
          <p className="mt-1 font-serif text-lg font-bold">운영 관리</p>
          <p className="mt-0.5 text-xs text-bark-400">{me.name ?? me.email}</p>
        </div>
        <AdminNav pending={pending} />
      </aside>
      <div className="min-w-0 space-y-6">{children}</div>
    </div>
  );
}
