import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { requireUser } from "@/lib/auth";
import { fail, handle, ok } from "@/lib/api";

const ALLOWED: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic" };
const MAX = 8 * 1024 * 1024;

/**
 * 이미지 업로드 (로그인 필수)
 * - 서버(Vercel): BLOB_READ_WRITE_TOKEN 이 있으면 Vercel Blob에 저장 → https 주소 반환
 * - PC: uploads/ 폴더에 저장 → /uploads/파일명 (app/uploads/[name] 라우트로 제공)
 */
export const POST = (req: Request) =>
  handle(async () => {
    await requireUser();
    const file = (await req.formData()).get("file");
    if (!(file instanceof File)) return fail("파일이 없습니다.");
    const ext = ALLOWED[file.type];
    if (!ext) return fail("JPG, PNG, WEBP 이미지만 올릴 수 있어요.");
    if (file.size > MAX) return fail("이미지는 8MB 이하만 올릴 수 있어요.");
    const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = await import("@vercel/blob");
      const blob = await put(`uploads/${name}`, file, { access: "public", contentType: file.type });
      return ok({ url: blob.url }, 201);
    }

    const dir = path.join(/*turbopackIgnore: true*/ process.cwd(), "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
    return ok({ url: `/uploads/${name}` }, 201);
  });
