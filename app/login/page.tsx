import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AuthShell from "@/components/AuthShell";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "로그인" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/";
  if (await getSession()) redirect(safeNext);
  return (
    <AuthShell title="다시 오셨네요" subtitle="이메일로 로그인하세요.">
      <LoginForm next={safeNext} />
      <p className="mt-6 text-center text-sm text-bark-500">
        아직 회원이 아니신가요?{" "}
        <Link href={`/register${next ? `?next=${encodeURIComponent(safeNext)}` : ""}`} className="font-semibold text-forest-700 underline">
          회원가입
        </Link>
      </p>
    </AuthShell>
  );
}
