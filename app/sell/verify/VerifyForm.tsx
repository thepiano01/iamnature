"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type V = { farmName: string; businessNumber: string; permitImage: string; idCardImage: string };

function Uploader({ label, desc, value, onChange }: { label: string; desc: string; value: string; onChange: (u: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <label className="group block cursor-pointer">
      <span className="label">{label}</span>
      <div className="grid aspect-[16/10] place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-hanji-300 bg-hanji-50 transition group-hover:border-forest-600">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="px-4 text-center text-xs text-bark-400">{busy ? "올리는 중…" : desc}</span>
        )}
      </div>
      {err && <span className="mt-1 block text-xs text-rose-600">{err}</span>}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setBusy(true);
          setErr(null);
          const fd = new FormData();
          fd.append("file", f);
          const data = await fetch("/api/upload", { method: "POST", body: fd }).then((r) => r.json()).catch(() => ({}));
          setBusy(false);
          if (data.ok) onChange(data.url);
          else setErr(data.error || "업로드 실패");
        }}
      />
    </label>
  );
}

export default function VerifyForm({ initial }: { initial: V }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [msg, setMsg] = useState<string | null>(initial.permitImage || initial.idCardImage ? "서류가 제출되어 심사 중이에요. 다시 올리면 교체됩니다." : null);
  const [pending, start] = useTransition();

  return (
    <form
      className="card space-y-5 p-5 sm:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await fetch("/api/sell/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
          const data = await res.json().catch(() => ({}));
          setMsg(data.ok ? "제출했어요. 확인 후 인증 배지가 붙습니다." : data.error || "제출하지 못했습니다.");
          router.refresh();
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">채취자·농장 이름</label>
          <input className="input" value={v.farmName} onChange={(e) => setV({ ...v, farmName: e.target.value })} />
        </div>
        <div>
          <label className="label">사업자등록번호 (선택)</label>
          <input className="input" value={v.businessNumber} onChange={(e) => setV({ ...v, businessNumber: e.target.value })} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Uploader label="영업신고증 / 임산물 채취 허가서" desc="사진을 눌러 올려주세요" value={v.permitImage} onChange={(u) => setV({ ...v, permitImage: u })} />
        <Uploader label="신분증 (주민번호 뒷자리 가림)" desc="주민등록번호 뒷자리는 꼭 가려주세요" value={v.idCardImage} onChange={(u) => setV({ ...v, idCardImage: u })} />
      </div>
      {msg && <p className="rounded-xl bg-hanji-100 px-3 py-2 text-sm text-bark-700">{msg}</p>}
      <button className="btn-primary w-full py-3" disabled={pending}>{pending ? "제출 중…" : "인증 서류 제출"}</button>
    </form>
  );
}
