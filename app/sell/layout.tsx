import { redirect } from "next/navigation";
import { getCurrentUser, isSellerRole } from "@/lib/auth";
import SellNav from "./SellNav";

export default async function SellLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/sell");
  if (!isSellerRole(user.role)) redirect("/me#become-seller");
  const sp = user.sellerProfile;
  const status = sp?.verified ? "인증 완료" : sp?.rejectReason ? "인증 반려" : sp?.permitImage || sp?.idCardImage ? "인증 심사 중" : "인증 필요";

  return (
    <div className="container-x grid gap-6 pt-6 sm:pt-10 lg:grid-cols-[220px_1fr] lg:gap-10">
      <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
        <div className="rounded-2xl bg-forest-900 p-4 text-hanji-50">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-forest-300">채취자 센터</p>
          <p className="mt-1 font-serif text-lg font-bold">{sp?.farmName || user.name || "채취자"}</p>
          <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${sp?.verified ? "bg-forest-500 text-white" : "bg-clay-500 text-white"}`}>{status}</span>
        </div>
        <SellNav />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
