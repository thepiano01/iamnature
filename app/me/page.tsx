import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser, isSellerRole } from "@/lib/auth";
import { codesFromUser } from "@/lib/health";
import HealthPicker from "@/components/HealthPicker";
import { LogoutButton } from "@/components/NavClient";
import ProfileForm from "./ProfileForm";

export const metadata: Metadata = { title: "내 정보" };
export const dynamic = "force-dynamic";

export default async function MePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/me");
  const [orderCount, cartCount] = await Promise.all([
    prisma.order.count({ where: { buyerId: user.id } }),
    prisma.cartItem.count({ where: { userId: user.id } }),
  ]);
  const seller = isSellerRole(user.role);
  const admin = user.role === "ADMIN";

  return (
    <div className="container-x max-w-3xl space-y-6 pt-8 sm:pt-12">
      <div className="flex items-end justify-between">
        <div>
          <p className="eyebrow">My page</p>
          <h1 className="h-serif mt-1 text-3xl sm:text-4xl">{user.name ?? "회원"}님</h1>
          <p className="mt-1 text-sm text-bark-500">{user.email}</p>
        </div>
        <LogoutButton />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link href="/wants?s=ALL&mine=1" className="card p-4 text-center hover:border-forest-300">
          <p className="text-2xl font-extrabold text-forest-800">🙋</p>
          <p className="text-xs text-bark-500">내 구해요</p>
        </Link>
        <Link href="/notifications" className="card p-4 text-center hover:border-forest-300">
          <p className="text-2xl font-extrabold text-forest-800">🔔</p>
          <p className="text-xs text-bark-500">알림</p>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Link href="/orders" className="card p-4 text-center hover:border-forest-300">
          <p className="font-serif text-2xl font-bold text-forest-900">{orderCount}</p>
          <p className="text-xs text-bark-500">주문 내역</p>
        </Link>
        <Link href="/cart" className="card p-4 text-center hover:border-forest-300">
          <p className="font-serif text-2xl font-bold text-forest-900">{cartCount}</p>
          <p className="text-xs text-bark-500">장바구니</p>
        </Link>
        <Link href={admin ? "/admin" : seller ? "/sell" : "#become-seller"} className="card p-4 text-center hover:border-forest-300">
          <p className="font-serif text-2xl font-bold text-clay-600">{admin || seller ? "→" : "+"}</p>
          <p className="text-xs text-bark-500">{admin ? "관리자" : seller ? "채취자 센터" : "채취자 되기"}</p>
        </Link>
      </div>

      <section className="card space-y-4 p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-bold">나의 건강상태</h2>
          <p className="text-sm text-bark-500">저장하면 홈과 건강 매칭 화면의 추천이 바로 바뀌어요.</p>
        </div>
        <HealthPicker initial={codesFromUser(user)} loggedIn submitLabel="저장" redirectTo={null} />
      </section>

      <section className="card space-y-4 p-5 sm:p-6">
        <h2 className="text-lg font-bold">기본 정보·배송지</h2>
        <ProfileForm
          defaults={{ name: user.name ?? "", phone: user.phone ?? "", zip: user.zip ?? "", address1: user.address1 ?? "", address2: user.address2 ?? "" }}
          canBecomeSeller={!seller && !admin}
        />
      </section>
    </div>
  );
}
