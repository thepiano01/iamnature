import { requireAdmin } from "@/lib/auth";
import { handle, ok } from "@/lib/api";
import { savePlant } from "@/lib/plantInput";

export const POST = (req: Request) =>
  handle(async () => {
    await requireAdmin();
    const p = await savePlant(null, await req.json());
    return ok({ id: p.id }, 201);
  });
