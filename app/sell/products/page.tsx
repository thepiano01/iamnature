import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { sellerPage } from "@/lib/auth";
import { won, ymd } from "@/lib/format";
import ProductArt from "@/components/ProductArt";
import { EmptyState } from "@/components/ProductCard";
import DeleteProductButton from "./DeleteProductButton";

export const metadata: Metadata = { title: "내 상품" };
export const dynamic = "force-dynamic";

export default async function SellProducts() {
  const me = await sellerPage();
  const products = await prisma.product.findMany({
    where: { sellerId: me.id },
    include: { images: { take: 1, orderBy: { isPrimary: "desc" } }, plant: { select: { category: true, commonName: true } }, _count: { select: { orderItems: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="eyebrow">Products</p>
          <h1 className="h-serif mt-1 text-3xl">내 상품 <span className="text-bark-400">{products.length}</span></h1>
        </div>
        <Link href="/sell/products/new" className="btn-accent btn-sm">+ 상품 올리기</Link>
      </div>
      {!products.length ? (
        <EmptyState title="아직 올린 상품이 없어요" desc="사진과 채취 정보만 있으면 3분이면 올릴 수 있어요." action={<Link href="/sell/products/new" className="btn-primary btn-sm">첫 상품 올리기</Link>} />
      ) : (
        <ul className="space-y-3">
          {products.map((p) => {
            const img = p.images[0]?.url || p.imageUrl;
            return (
              <li key={p.id} className="card flex items-center gap-4 p-3 sm:p-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <ProductArt category={p.plant?.category} className="h-full w-full" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link href={`/products/${p.id}`} className="line-clamp-1 font-semibold hover:underline">{p.title}</Link>
                    {p.quantity === 0 && <span className="shrink-0 rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-600">판매중지·품절</span>}
                  </div>
                  <p className="text-xs text-bark-500">
                    {won(p.price)} / {p.unit} · 재고 {p.quantity}{p.unit} · 주문 {p._count.orderItems}건
                  </p>
                  <p className="text-[11px] text-bark-400">{p.plant?.commonName ?? p.plantName ?? "식물 미지정"} · 등록 {ymd(p.createdAt)}</p>
                </div>
                <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row">
                  <Link href={`/sell/products/${p.id}/edit`} className="btn-ghost btn-sm">수정</Link>
                  <DeleteProductButton id={p.id} hasOrders={p._count.orderItems > 0} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
