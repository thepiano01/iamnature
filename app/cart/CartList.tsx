"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import ProductArt from "@/components/ProductArt";
import { won } from "@/lib/format";

type Item = {
  id: number;
  quantity: number;
  product: { id: number; title: string; price: number; unit: string; stock: number; image: string | null; category: string | null; farm: string | null };
};

export default function CartList({ items }: { items: Item[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const total = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const overStock = items.some((i) => i.quantity > i.product.stock);

  const setQty = (id: number, quantity: number) =>
    start(async () => {
      await fetch("/api/cart", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, quantity }) });
      router.refresh();
    });
  const remove = (id: number) =>
    start(async () => {
      await fetch(`/api/cart?id=${id}`, { method: "DELETE" });
      router.refresh();
    });

  return (
    <div className={`grid gap-8 lg:grid-cols-[1fr_340px] ${pending ? "opacity-70" : ""}`}>
      <ul className="divide-y divide-hanji-200 rounded-[var(--radius-card)] border border-hanji-200 bg-white">
        {items.map((i) => (
          <li key={i.id} className="flex gap-4 p-4 sm:p-5">
            <Link href={`/products/${i.product.id}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-hanji-100">
              {i.product.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={i.product.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <ProductArt category={i.product.category} className="h-full w-full" />
              )}
            </Link>
            <div className="flex min-w-0 flex-1 flex-col">
              {i.product.farm && <p className="text-[11px] text-bark-400">{i.product.farm}</p>}
              <Link href={`/products/${i.product.id}`} className="line-clamp-2 font-semibold text-bark-900 hover:underline">{i.product.title}</Link>
              <p className="text-xs text-bark-500">{won(i.product.price)} / {i.product.unit}</p>
              {i.quantity > i.product.stock && <p className="text-xs font-semibold text-rose-600">재고 부족 (남은 {i.product.stock}{i.product.unit})</p>}
              <div className="mt-auto flex items-center justify-between pt-2">
                <div className="flex items-center overflow-hidden rounded-full border border-hanji-300">
                  <button className="h-8 w-8 hover:bg-hanji-100 disabled:opacity-30" disabled={i.quantity <= 1} onClick={() => setQty(i.id, i.quantity - 1)}>−</button>
                  <span className="w-8 text-center text-sm font-semibold">{i.quantity}</span>
                  <button className="h-8 w-8 hover:bg-hanji-100 disabled:opacity-30" disabled={i.quantity >= i.product.stock} onClick={() => setQty(i.id, i.quantity + 1)}>+</button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-forest-900">{won(i.product.price * i.quantity)}</span>
                  <button onClick={() => remove(i.id)} className="text-xs text-bark-400 hover:text-rose-600">삭제</button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="h-fit space-y-4 rounded-[var(--radius-card)] border border-hanji-200 bg-white p-5 lg:sticky lg:top-24">
        <div className="flex justify-between text-sm text-bark-500">
          <span>상품 {items.length}개</span>
          <span>{won(total)}</span>
        </div>
        <div className="flex items-baseline justify-between border-t border-hanji-200 pt-4">
          <span className="font-semibold">결제 예정 금액</span>
          <span className="font-serif text-2xl font-bold text-forest-900">{won(total)}</span>
        </div>
        <Link href="/checkout" aria-disabled={overStock} className={`btn-accent w-full py-3.5 ${overStock ? "pointer-events-none opacity-50" : ""}`}>
          주문하기
        </Link>
        <p className="text-center text-[11px] text-bark-400">채취자가 산지에서 직접 손질해 발송합니다.</p>
      </aside>
    </div>
  );
}
