import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { sellerPage } from "@/lib/auth";
import { plantOptions } from "@/lib/plants";
import ProductForm from "../../ProductForm";

export const metadata: Metadata = { title: "상품 수정" };
export const dynamic = "force-dynamic";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const me = await sellerPage();
  const id = Number((await params).id);
  const p = await prisma.product.findFirst({ where: { id, sellerId: me.id }, include: { images: { orderBy: [{ isPrimary: "desc" }, { id: "asc" }] } } });
  if (!p) notFound();
  const images = p.images.length ? p.images.map((i) => i.url) : p.imageUrl ? [p.imageUrl] : [];
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <p className="eyebrow">Edit product</p>
        <h1 className="h-serif mt-1 text-3xl">상품 수정</h1>
      </div>
      <ProductForm
        plants={await plantOptions()}
        initial={{
          id: p.id,
          title: p.title,
          plantId: p.plantId,
          plantName: p.plantName ?? "",
          region: p.region ?? "",
          harvestDate: p.harvestDate ? p.harvestDate.toISOString().slice(0, 10) : "",
          formState: p.formState,
          unit: p.unit,
          price: p.price,
          quantity: p.quantity,
          description: p.description ?? "",
          images,
        }}
      />
    </div>
  );
}
