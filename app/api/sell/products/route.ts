import { prisma } from "@/lib/db";
import { requireSeller } from "@/lib/auth";
import { handle, ok } from "@/lib/api";
import { parseProductInput } from "@/lib/sellerInput";

export const POST = (req: Request) =>
  handle(async () => {
    const me = await requireSeller();
    const { data, images } = parseProductInput(await req.json());
    const p = await prisma.product.create({
      data: {
        ...data,
        sellerId: me.id,
        images: { create: images.map((url, i) => ({ url, isPrimary: i === 0 })) },
      },
    });
    return ok({ id: p.id }, 201);
  });
