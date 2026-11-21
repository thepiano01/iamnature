import { PrismaClient } from "@prisma/client";

const isPg = (v?: string) => !!v && /^postgres(ql)?:\/\//.test(v);

function withParams(url: string, params: Record<string, string>) {
  const u = new URL(url);
  for (const [k, v] of Object.entries(params)) if (!u.searchParams.has(k)) u.searchParams.set(k, v);
  return u.toString();
}

/**
 * 실행 중 DB 연결 주소 (Vercel 서버리스 대응)
 * - 커넥션 풀 주소가 있으면 사용 (무료 DB 연결 수 한도 보호)
 * - 없으면 직접 연결 + 인스턴스당 연결 수 제한
 * - 로컬 SQLite면 undefined → schema.prisma 설정 그대로 사용
 */
function runtimeUrl(): string | undefined {
  const e = process.env;
  const pooled = [e.DATABASE_URL_POOLED, e.POSTGRES_PRISMA_URL].find(isPg);
  if (pooled) return withParams(pooled, { pgbouncer: "true", connection_limit: "5" });
  const direct = [e.DATABASE_URL, e.POSTGRES_URL, e.DATABASE_URL_UNPOOLED, e.POSTGRES_URL_NON_POOLING].find(isPg);
  if (direct) return withParams(direct, { connection_limit: "3", pool_timeout: "20" });
  return undefined;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const url = runtimeUrl();
export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["error", "warn"], ...(url ? { datasourceUrl: url } : {}) });

// 같은 서버 인스턴스 안에서는 연결을 재사용
globalForPrisma.prisma = prisma;
