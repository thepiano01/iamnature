import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { setSessionCookie, type Role } from "@/lib/auth";
import { fail, handle, ok } from "@/lib/api";
import { HEALTH } from "@/lib/health";

export const POST = (req: Request) =>
  handle(async () => {
    const b = await req.json();
    const email = String(b.email || "").trim().toLowerCase();
    const password = String(b.password || "");
    const name = String(b.name || "").trim();
    const role: Role = b.role === "SELLER" ? "SELLER" : "BUYER";

    if (!name) return fail("이름을 입력해 주세요.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return fail("올바른 이메일을 입력해 주세요.");
    if (password.length < 8) return fail("비밀번호는 8자 이상이어야 합니다.");
    if (await prisma.user.findUnique({ where: { email } })) return fail("이미 가입된 이메일입니다.", 409);

    const codes: string[] = Array.isArray(b.health) ? b.health : [];
    const healthData = Object.fromEntries(HEALTH.map((h) => [h.key, codes.includes(h.code)]));

    const user = await prisma.user.create({
      data: {
        email,
        name,
        role,
        passwordHash: await bcrypt.hash(password, 10),
        ...healthData,
        ...(role === "SELLER"
          ? { sellerProfile: { create: { farmName: String(b.farmName || "").trim() || null, businessNumber: String(b.businessNumber || "").trim() || null } } }
          : {}),
      },
    });
    await setSessionCookie({ userId: user.id, role, email });
    return ok({ user: { id: user.id, name: user.name, role } }, 201);
  });
