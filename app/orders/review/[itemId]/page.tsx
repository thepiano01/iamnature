import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import ProductArt from "@/components/ProductArt";
import ReviewForm from "./ReviewForm";

export const metadata: Metadata = { title: "후기 쓰기" };
export const dynamic = "force-dynamic";

export default async function WriteReview({ params }: { params: Promise<{ itemId: string }> }) {
  const user = await getCurrentUser();
  const id = Number((await params).itemId);
  if (!user) redirect(`/login?next=/orders/review/${id}`);
  const item = await prisma.orderItem.findFirst({
    where: { id, order: { buyerId: user.id } },
    include: {
      review: true,
      product: { include: { images: { take: 1, orderBy: { isPrimary: "desc" } }, plant: { select: { category: true } }, seller: { select: { name: true, sellerProfile: { select: { farmName: true } } } } } },
    },
  });
  if (!item) notFound();
  if (item.review) redirect(`/products/${item.productId}#reviews`);
  const img = item.product.images[0]?.url || item.product.imageUrl;
  const farm = item.product.seller?.sellerProfile?.farmName || item.product.seller?.name || "채취자";

  return (
    <div className="container-x max-w-2xl pt-8 sm:pt-12">
      <Link href="/orders" className="text-xs text-bark-400 hover:text-bark-700">← 주문 내역</Link>
      <h1 className="h-serif mt-2 text-3xl">후기 쓰기</h1>
      <div className="mt-5 flex items-center gap-3 rounded-[1.5rem] bg-white p-3 ring-1 ring-hanji-200">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <ProductArt category={item.product.plant?.category} className="h-full w-full" />}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-bark-400">{farm}</p>
          <p className="line-clamp-2 font-bold text-bark-900">{item.productTitle}</p>
        </div>
      </div>
      <ReviewForm orderItemId={item.id} farm={farm} />
    </div>
  );
}
