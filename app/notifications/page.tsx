import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { NotiItem, ReadAllButton } from "./NotiClient";

export const metadata: Metadata = { title: "알림" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login?next=/notifications");
  const list = await prisma.notification.findMany({ where: { userId: me.id }, orderBy: { createdAt: "desc" }, take: 100 });
  const unread = list.filter((n) => !n.readAt).length;
  return (
    <div className="container-x max-w-2xl pt-8 sm:pt-12">
      <div className="flex items-end justify-between">
        <h1 className="h-serif text-3xl">알림 {unread > 0 && <span className="text-clay-600">{unread}</span>}</h1>
        {unread > 0 && <ReadAllButton />}
      </div>
      <ul className="mt-6 space-y-2">
        {!list.length && <li className="rounded-2xl bg-hanji-100 p-8 text-center text-sm text-bark-500">아직 받은 알림이 없어요.</li>}
        {list.map((n) => <NotiItem key={n.id} n={{ id: n.id, title: n.title, body: n.body, link: n.link, read: !!n.readAt, at: n.createdAt.toISOString() }} />)}
      </ul>
    </div>
  );
}
