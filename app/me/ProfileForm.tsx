"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type D = { name: string; phone: string; zip: string; address1: string; address2: string };

async function patch(body: object) {
  const res = await fetch("/api/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return res.ok && data.ok ? null : data.error || "저장하지 못했습니다.";
}

export default function ProfileForm({ defaults, canBecomeSeller }: { defaults: D; canBecomeSeller: boolean }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <>
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = Object.fromEntries(new FormData(e.currentTarget));
          start(async () => {
            const err = await patch(fd);
            setMsg(err ?? "저장했어요.");
            router.refresh();
          });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">이름</label>
            <input name="name" defaultValue={defaults.name} className="input" />
          </div>
          <div>
            <label className="label">연락처</label>
            <input name="phone" defaultValue={defaults.phone} className="input" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
          <div>
            <label className="label">우편번호</label>
            <input name="zip" defaultValue={defaults.zip} className="input" />
          </div>
          <div>
            <label className="label">주소</label>
            <input name="address1" defaultValue={defaults.address1} className="input" />
          </div>
        </div>
        <div>
          <label className="label">상세 주소</label>
          <input name="address2" defaultValue={defaults.address2} className="input" />
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-primary" disabled={pending}>저장</button>
          {msg && <span className="text-sm text-bark-500">{msg}</span>}
        </div>
      </form>

      {canBecomeSeller && (
        <div id="become-seller" className="mt-4 rounded-2xl border border-dashed border-clay-500/50 bg-clay-50 p-4">
          <p className="font-semibold text-clay-700">직접 채취하신 것도 팔아보세요</p>
          <p className="mt-1 text-sm text-bark-500">구매는 그대로 하면서 채취자 센터에서 상품을 올릴 수 있어요.</p>
          <button
            className="btn-accent btn-sm mt-3"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const err = await patch({ becomeSeller: true });
                if (err) return setMsg(err);
                router.push("/sell/verify");
                router.refresh();
              })
            }
          >
            채취자로 전환하기
          </button>
        </div>
      )}
    </>
  );
}
