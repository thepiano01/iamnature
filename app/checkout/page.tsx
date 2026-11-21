import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { won } from "@/lib/format";
import CheckoutForm from "./CheckoutForm";

export const metadata: Metadata = { title: "주문하기" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/checkout");
  const items = await prisma.cartItem.findMany({ where: { userId: user.id }, include: { product: true } });
  if (!items.length) redirect("/cart");
  const total = items.reduce((s, i) => s + i.product.price * i.quantity, 0);

  return (
    <div className="container-x pt-8 sm:pt-12">
      <p className="eyebrow">Checkout</p>
      <h1 className="h-serif mt-1 text-3xl sm:text-4xl">주문하기</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <CheckoutForm
          defaults={{ name: user.name ?? "", phone: user.phone ?? "", zip: user.zip ?? "", address1: user.address1 ?? "", address2: user.address2 ?? "" }}
          total={total}
        />
        <aside className="h-fit space-y-3 rounded-[var(--radius-card)] border border-hanji-200 bg-white p-5 lg:sticky lg:top-24">
          <p className="font-semibold">주문 상품</p>
          <ul className="space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3">
                <span className="line-clamp-1 text-bark-700">{i.product.title} × {i.quantity}</span>
                <span className="shrink-0 font-medium">{won(i.product.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-baseline justify-between border-t border-hanji-200 pt-3">
            <span className="font-semibold">합계</span>
            <span className="font-serif text-2xl font-bold text-forest-900">{won(total)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
