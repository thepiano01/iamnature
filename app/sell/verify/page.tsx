import type { Metadata } from "next";
import { sellerPage } from "@/lib/auth";
import VerifyForm from "./VerifyForm";

export const metadata: Metadata = { title: "채취자 인증" };
export const dynamic = "force-dynamic";

export default async function VerifyPage() {
  const me = await sellerPage();
  const sp = me.sellerProfile;
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <p className="eyebrow">Verification</p>
        <h1 className="h-serif mt-1 text-3xl">채취자 인증</h1>
        <p className="mt-2 text-sm text-bark-500">서류를 올려주시면 확인 후 상품에 <b className="text-forest-800">인증 채취자</b> 배지가 붙어요. 구매자가 가장 먼저 보는 신뢰 표시입니다.</p>
      </div>
      {sp?.verified ? (
        <div className="rounded-2xl border border-forest-100 bg-forest-50 p-5 font-semibold text-forest-800">✓ 인증이 완료된 채취자입니다.</div>
      ) : (
        <>
        {sp?.rejectReason && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <b>인증이 반려되었어요.</b> 사유: {sp.rejectReason}
            <p className="mt-1 text-xs text-rose-700">서류를 다시 올려 제출하면 재심사합니다.</p>
          </div>
        )}
        <VerifyForm
          initial={{ farmName: sp?.farmName ?? "", businessNumber: sp?.businessNumber ?? "", permitImage: sp?.permitImage ?? "", idCardImage: sp?.idCardImage ?? "" }}
        />
        </>
      )}
    </div>
  );
}
