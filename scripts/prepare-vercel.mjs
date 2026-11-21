// Vercel 배포 시에만 실행: Prisma DB를 SQLite → PostgreSQL로 전환
// Neon / Prisma Postgres / Vercel Postgres 어느 것을 연결해도 동작하도록
// postgres:// 로 시작하는 접속 주소가 들어 있는 환경변수를 자동으로 찾습니다.
// 로컬(PC)에서는 실행하지 않으므로 기존 SQLite 그대로 사용됩니다.
import { readFileSync, writeFileSync } from "fs";

const CANDIDATES = ["DATABASE_URL", "POSTGRES_URL", "POSTGRES_PRISMA_URL", "DATABASE_URL_UNPOOLED", "POSTGRES_URL_NON_POOLING", "PRISMA_DATABASE_URL"];
const isPg = (v) => typeof v === "string" && /^postgres(ql)?:\/\//.test(v);
const name = CANDIDATES.find((k) => isPg(process.env[k]));

if (!name) {
  console.error("❌ Postgres DB가 연결되지 않았습니다. Vercel 프로젝트 → Storage에서 DB(Neon 또는 Prisma Postgres)를 만들어 연결한 뒤 Redeploy 하세요.");
  console.error("   확인한 환경변수: " + CANDIDATES.map((k) => `${k}=${process.env[k] ? "(있음, 형식 다름)" : "(없음)"}`).join(", "));
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET 환경변수를 넣어주세요.");
  process.exit(1);
}

const p = "prisma/schema.prisma";
const s = readFileSync(p, "utf8")
  .replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"')
  .replace(/url\s*=\s*env\("DATABASE_URL"\)/, `url      = env("${name}")`);
writeFileSync(p, s);
console.log(`✅ Prisma → postgresql (접속 주소: ${name})`);
