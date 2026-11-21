import Link from "next/link";
import type { Metadata } from "next";
import { PageHead } from "@/components/admin/ui";
import PlantForm, { EMPTY_PLANT } from "../PlantForm";

export const metadata: Metadata = { title: "식물 추가" };

export default function NewPlant() {
  return (
    <>
      <Link href="/admin/plants" className="text-xs text-bark-400 hover:text-bark-700">← 식물·효능 DB</Link>
      <PageHead eyebrow="New plant" title="식물 추가" />
      <PlantForm initial={EMPTY_PLANT} />
    </>
  );
}
