import type { Metadata } from "next";
import { plantOptions } from "@/lib/plants";
import ProductForm, { EMPTY_PRODUCT } from "../ProductForm";

export const metadata: Metadata = { title: "상품 올리기" };
export const dynamic = "force-dynamic";

export default async function NewProduct() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <p className="eyebrow">New product</p>
        <h1 className="h-serif mt-1 text-3xl">새 상품 올리기</h1>
      </div>
      <ProductForm plants={await plantOptions()} initial={EMPTY_PRODUCT} />
    </div>
  );
}
