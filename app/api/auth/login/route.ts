import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { setSessionCookie, type Role } from "@/lib/auth";
import { fail, handle, ok } from "@/lib/api";

export const POST = (req: Request) =>
  handle(async () => {
    const { email, password } = await req.json();
    if (!email || !password) return fail("이메일과 비밀번호를 입력해 주세요.");
    const e = String(email).trim();
    const user =
      (await prisma.user.findUnique({ where: { email: e } })) ??
      (await prisma.user.findUnique({ where: { email: e.toLowerCase() } }));
    if (!user?.passwordHash || !(await bcrypt.compare(String(password), user.passwordHash))) {
      return fail("이메일 또는 비밀번호가 올바르지 않습니다.", 401);
    }
    if (user.suspended) return fail("이용이 정지된 계정입니다. 고객센터로 문의해 주세요.", 403);
    await setSessionCookie({ userId: user.id, role: user.role as Role, email: user.email });
    return ok({ user: { id: user.id, name: user.name, role: user.role } });
  });
