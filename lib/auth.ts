import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./db";

export const AUTH_COOKIE = "auth_token";
const MAX_AGE = 60 * 60 * 24 * 7; // 7일

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET 환경변수를 .env에 설정해 주세요.");
  return new TextEncoder().encode(s);
}

export type Role = "BUYER" | "SELLER" | "BOTH" | "ADMIN";
export type Session = { userId: number; role: Role; email: string };

export async function signSession(s: Session) {
  return new SignJWT({ email: s.email, role: s.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(s.userId))
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifyToken(token?: string | null): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const userId = Number(payload.sub);
    if (!userId) return null;
    return { userId, role: (payload.role as Role) || "BUYER", email: String(payload.email || "") };
  } catch {
    return null;
  }
}

export async function setSessionCookie(s: Session) {
  const token = await signSession(s);
  (await cookies()).set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(AUTH_COOKIE);
}

export async function getSession() {
  return verifyToken((await cookies()).get(AUTH_COOKIE)?.value);
}

/** 서버에서 항상 DB 기준으로 현재 사용자를 조회 (비밀번호 해시 제외) */
export async function getCurrentUser() {
  const s = await getSession();
  if (!s) return null;
  const user = await prisma.user.findUnique({
    where: { id: s.userId },
    include: { sellerProfile: true },
  });
  if (!user || user.suspended) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safe } = user;
  return safe;
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export function isSellerRole(role?: string | null) {
  return role === "SELLER" || role === "BOTH";
}

export function isAdminRole(role?: string | null) {
  return role === "ADMIN";
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** API 라우트용: 로그인 필수 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "로그인이 필요합니다.");
  return user;
}

/** API 라우트용: 판매자 필수 — sellerId는 항상 세션에서 결정 */
export async function requireSeller() {
  const user = await requireUser();
  if (!isSellerRole(user.role)) throw new HttpError(403, "판매자 계정만 이용할 수 있습니다.");
  return user;
}

/** 페이지용: 판매자가 아니면 리다이렉트 */
export async function sellerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/sell");
  if (!isSellerRole(user.role)) redirect("/me#become-seller");
  return user;
}

/** API 라우트용: 관리자 필수 */
export async function requireAdmin() {
  const user = await requireUser();
  if (!isAdminRole(user.role)) throw new HttpError(403, "관리자만 이용할 수 있습니다.");
  return user;
}

/** 페이지용: 관리자가 아니면 리다이렉트 */
export async function adminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!isAdminRole(user.role)) redirect("/");
  return user;
}
