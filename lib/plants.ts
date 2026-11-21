import "server-only";
import { prisma } from "./db";
import type { PlantOption } from "@/app/sell/products/ProductForm";

export async function plantOptions(): Promise<PlantOption[]> {
  const plants = await prisma.plant.findMany({
    select: { id: true, commonName: true, category: true, conditions: { select: { condition: { select: { name: true } } } } },
    orderBy: { commonName: "asc" },
  });
  return plants.map((p) => ({ id: p.id, commonName: p.commonName, category: p.category, conditions: p.conditions.map((c) => c.condition.name) }));
}
