"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { won } from "@/lib/format";
import AddressFields from "@/components/AddressFields";

type D = { name: string; phone: string; zip: string; address1: string; address2: string };

export default function CheckoutForm({ defaults, total }: { defaults: D; total: number }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setErr(null);
        start(async () => {
          const res = await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...Object.fromEntries(fd), saveAddress: fd.get("saveAddress") === "on" }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.ok) return setErr(data.error || "주문에 실패했습니다.");
          router.push(`/orders?done=${data.orderId}`);
          router.refresh();
        });
      }}
    >
      <fieldset className="card space-y-4 p-5 sm:p-6">
        <legend className="sr-only">배송 정보</legend>
        <p className="font-semibold">배송 정보</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">받는 분</label>
            <input name="shippingName" defaultValue={defaults.name} required className="input" />
          </div>
          <div>
            <label className="label">연락처</label>
            <input name="shippingPhone" defaultValue={defaults.phone} required inputMode="tel" placeholder="010-0000-0000" className="input" />
          </div>
        </div>
        <AddressFields
          required
          defaults={{ zip: defaults.zip, address1: defaults.address1, address2: defaults.address2 }}
          names={{ zip: "shippingZip", address1: "shippingAddress1", address2: "shippingAddress2" }}
        />
        <div>
          <label className="label">요청사항</label>
          <input name="requestMessage" placeholder="예: 문 앞에 놓아주세요" className="input" />
        </div>
        <label className="flex items-center gap-2 text-sm text-bark-700">
          <input type="checkbox" name="saveAddress" defaultChecked className="h-4 w-4 accent-forest-700" />
          이 배송지를 기본 배송지로 저장
        </label>
      </fieldset>

      <div className="card space-y-2 p-5 sm:p-6">
        <p className="font-semibold">결제</p>
        <p className="text-sm text-bark-500">결제 대행(PG) 연동 전 단계입니다. 주문하면 채취자에게 바로 전달되고, 결제 안내는 별도로 드립니다.</p>
      </div>

      {err && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>}
      <button className="btn-accent w-full py-4 text-base" disabled={pending}>
        {pending ? "주문 중…" : `${won(total)} 주문하기`}
      </button>
    </form>
  );
}
