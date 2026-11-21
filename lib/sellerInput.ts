import { HttpError } from "./auth";

/** 상품 등록/수정 입력 검증 */
export function parseProductInput(b: Record<string, unknown>) {
  const title = String(b.title ?? "").trim();
  const price = Math.round(Number(b.price));
  const quantity = Math.round(Number(b.quantity));
  if (!title) throw new HttpError(400, "상품명을 입력해 주세요.");
  if (!(price > 0)) throw new HttpError(400, "가격을 확인해 주세요.");
  if (!(quantity >= 0)) throw new HttpError(400, "수량을 확인해 주세요.");
  const plantId = Number(b.plantId) || null;
  const harvest = b.harvestDate ? new Date(String(b.harvestDate)) : null;
  const images = Array.isArray(b.images) ? b.images.map(String).filter((u) => u.startsWith("/uploads/") || u.startsWith("https://")).slice(0, 10) : [];
  return {
    data: {
      title,
      price,
      quantity,
      unit: String(b.unit ?? "kg").trim() || "kg",
      formState: String(b.formState ?? "생것").trim() || "생것",
      region: String(b.region ?? "").trim() || null,
      description: String(b.description ?? "").trim() || null,
      plantName: String(b.plantName ?? "").trim() || null,
      plantId,
      harvestDate: harvest && !isNaN(+harvest) ? harvest : null,
      imageUrl: images[0] ?? null,
    },
    images,
  };
}
