// Vercel 배포 시에만 실행: Prisma DB를 SQLite → PostgreSQL(Neon)로 전환
// 로컬(PC)에서는 실행하지 않으므로 기존 SQLite 그대로 사용됩니다.
import { readFileSync, writeFileSync } from "fs";

const p = "prisma/schema.prisma";
const s = readFileSync(p, "utf8").replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');
writeFileSync(p, s);
if (!process.env.DATABASE_URL?.startsWith("postgres")) {
  console.error("❌ DATABASE_URL 환경변수에 Neon(Postgres) 주소를 넣어주세요.");
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET 환경변수를 넣어주세요.");
  process.exit(1);
}
console.log("✅ Prisma provider → postgresql");
