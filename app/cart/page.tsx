import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { EmptyState } from "@/components/ProductCard";
import CartList from "./CartList";

export const metadata: Metadata = { title: "장바구니" };
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/cart");
  const items = await prisma.cartItem.findMany({
    where: { userId: user.id },
    include: {
      product: {
        include: {
          images: { take: 1, orderBy: { isPrimary: "desc" } },
          plant: { select: { category: true } },
          seller: { select: { name: true, sellerProfile: { select: { farmName: true } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container-x pt-8 sm:pt-12">
      <p className="eyebrow">Cart</p>
      <h1 className="h-serif mt-1 text-3xl sm:text-4xl">장바구니</h1>
      <div className="mt-8">
        {items.length ? (
          <CartList
            items={items.map((i) => ({
              id: i.id,
              quantity: i.quantity,
              product: {
                id: i.product.id,
                title: i.product.title,
                price: i.product.price,
                unit: i.product.unit,
                stock: i.product.quantity,
                image: i.product.images[0]?.url || i.product.imageUrl || null,
                category: i.product.plant?.category ?? null,
                farm: i.product.seller?.sellerProfile?.farmName || i.product.seller?.name || null,
              },
            }))}
          />
        ) : (
          <EmptyState title="장바구니가 비어 있어요" desc="산에서 갓 내려온 나물·약초를 둘러보세요." action={<Link href="/products" className="btn-primary btn-sm">상품 보러 가기</Link>} />
        )}
      </div>
    </div>
  );
}
