// Vercel 배포 시에만 실행: Prisma DB를 SQLite → PostgreSQL로 전환 (테이블 생성·초기 데이터용 직접 연결 주소)
// 실행 중 연결 주소(커넥션 풀 우선)는 lib/db.ts 에서 고릅니다.
// Neon / Prisma Postgres / Vercel Postgres 어느 것을 연결해도 동작하도록 환경변수를 자동으로 찾습니다.
// 로컬(PC)에서는 실행하지 않으므로 기존 SQLite 그대로 사용됩니다.
import { readFileSync, writeFileSync } from "fs";

const isPg = (v) => typeof v === "string" && /^postgres(ql)?:\/\//.test(v);
const direct = ["DATABASE_URL_UNPOOLED", "POSTGRES_URL_NON_POOLING", "DATABASE_URL", "POSTGRES_URL", "DATABASE_URL_POOLED", "POSTGRES_PRISMA_URL"].find((k) => isPg(process.env[k]));

if (!direct) {
  console.error("❌ Postgres DB가 연결되지 않았습니다. Vercel 프로젝트 → Storage에서 DB를 만들어 연결한 뒤 Redeploy 하세요.");
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET 환경변수를 넣어주세요.");
  process.exit(1);
}

const p = "prisma/schema.prisma";
const s = readFileSync(p, "utf8")
  .replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"')
  .replace(/url\s*=\s*env\("[A-Z_]+"\)/, `url      = env("${direct}")`);
writeFileSync(p, s);
console.log(`✅ Prisma → postgresql (설정용 연결: ${direct})`);
