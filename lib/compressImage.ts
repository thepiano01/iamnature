"use client";

/**
 * 업로드 전 브라우저에서 사진 크기 줄이기
 * - 긴 변 최대 1920px, JPEG 품질 0.85 → 보통 300KB~1MB
 * - 서버(Vercel) 업로드 한도 4.5MB를 넘지 않도록
 * - 실패하거나 이미 작으면 원본 그대로 사용
 */
export async function compressImage(file: File, maxSide = 1920, quality = 0.85): Promise<File> {
  if (!file.type.startsWith("image/") || file.size < 900 * 1024) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

/** 사진 1장 업로드 → url 반환 (실패 시 에러 메시지 throw) */
export async function uploadImage(file: File): Promise<string> {
  const small = await compressImage(file);
  if (small.size > 4.4 * 1024 * 1024) throw new Error("사진이 너무 커요. 4MB 이하로 올려주세요.");
  const fd = new FormData();
  fd.append("file", small);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new Error(data.error || (res.status === 413 ? "사진이 너무 커요." : "업로드 실패"));
  return data.url as string;
}
