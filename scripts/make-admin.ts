/* eslint-disable */
// 기존 회원을 관리자로 지정: npm run make-admin -- you@example.com
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const email = process.argv[2];

(async () => {
  if (!email) {
    console.log("사용법: npm run make-admin -- 이메일");
    process.exit(1);
  }
  const u = await prisma.user.update({ where: { email }, data: { role: "ADMIN" } }).catch(() => null);
  console.log(u ? `✅ ${email} 계정이 관리자가 되었습니다. 다시 로그인하세요.` : `❌ ${email} 회원을 찾을 수 없습니다.`);
  await prisma.$disconnect();
})();
