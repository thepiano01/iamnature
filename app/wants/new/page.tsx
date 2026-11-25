import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import WantForm from "./WantForm";

export const metadata: Metadata = { title: "구해요 올리기" };
export const dynamic = "force-dynamic";

export default async function NewWant({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/wants/new");
  const { q } = await searchParams;
  const plants = await prisma.plant.findMany({ select: { id: true, commonName: true }, orderBy: { commonName: "asc" } });
  return (
    <div className="container-x max-w-2xl pt-8 sm:pt-12">
      <Link href="/wants" className="text-xs text-bark-400 hover:text-bark-700">← 구해요</Link>
      <h1 className="h-serif mt-2 text-3xl">무엇을 구하세요?</h1>
      <p className="mt-2 text-sm text-bark-500">올리면 그 품목을 팔아본 채취자 → 지금 파는 채취자 → 비슷한 품목 채취자 순으로 알림이 가요.</p>
      <WantForm plants={plants} initialKeyword={q ?? ""} defaultRegion={user.address1?.split(" ").slice(0, 2).join(" ") ?? ""} />
    </div>
  );
}
