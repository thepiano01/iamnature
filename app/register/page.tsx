import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AuthShell from "@/components/AuthShell";
import RegisterForm from "./RegisterForm";

export const metadata: Metadata = { title: "회원가입" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ role?: string; next?: string }> }) {
  const { role, next } = await searchParams;
  if (await getSession()) redirect("/");
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : null;
  return (
    <AuthShell title="함께 시작해요" subtitle="구매만 하실 건가요, 직접 채취해서 파실 건가요?">
      <RegisterForm initialRole={role === "SELLER" ? "SELLER" : "BUYER"} next={safeNext} />
      <p className="mt-6 text-center text-sm text-bark-500">
        이미 회원이신가요? <Link href="/login" className="font-semibold text-forest-700 underline">로그인</Link>
      </p>
    </AuthShell>
  );
}
