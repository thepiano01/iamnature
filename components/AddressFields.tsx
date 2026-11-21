"use client";

import { useEffect, useRef, useState } from "react";

/* 카카오(다음) 우편번호 서비스 — 무료, API 키 불필요
   https://postcode.map.kakao.com/guide */
const SCRIPT_SRC = "https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

type DaumAddress = {
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
  userSelectedType: "R" | "J";
  bname: string;
  buildingName: string;
  apartment: "Y" | "N";
};

declare global {
  interface Window {
    daum?: { Postcode: new (opts: Record<string, unknown>) => { embed: (el: HTMLElement, o?: Record<string, unknown>) => void } };
  }
}

let loading: Promise<void> | null = null;
function loadScript() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.daum?.Postcode) return Promise.resolve();
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = SCRIPT_SRC;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        loading = null;
        reject(new Error("주소 검색을 불러오지 못했어요."));
      };
      document.head.appendChild(s);
    });
  }
  return loading;
}

export default function AddressFields({
  defaults,
  names = { zip: "zip", address1: "address1", address2: "address2" },
  required = false,
}: {
  defaults: { zip: string; address1: string; address2: string };
  names?: { zip: string; address1: string; address2: string };
  required?: boolean;
}) {
  const [zip, setZip] = useState(defaults.zip);
  const [addr1, setAddr1] = useState(defaults.address1);
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !boxRef.current || !window.daum) return;
        boxRef.current.innerHTML = "";
        new window.daum.Postcode({
          width: "100%",
          height: "100%",
          animation: true,
          oncomplete: (d: DaumAddress) => {
            // 도로명 주소 기준 + (동, 건물명) 참고항목
            let addr = d.userSelectedType === "R" ? d.roadAddress : d.jibunAddress;
            if (d.userSelectedType === "R") {
              const extra = [d.bname && /[동|로|가]$/.test(d.bname) ? d.bname : "", d.buildingName && d.apartment === "Y" ? d.buildingName : ""].filter(Boolean).join(", ");
              if (extra) addr += ` (${extra})`;
            }
            setZip(d.zonecode);
            setAddr1(addr);
            setOpen(false);
            setTimeout(() => detailRef.current?.focus(), 50);
          },
        }).embed(boxRef.current, { autoClose: false });
      })
      .catch((e: Error) => {
        setErr(e.message);
        setOpen(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const openSearch = () => {
    setErr(null);
    setOpen(true);
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-[150px_1fr]">
        <div>
          <label className="label">우편번호</label>
          <div className="relative">
            <input name={names.zip} value={zip} readOnly onClick={openSearch} placeholder="검색" className="input cursor-pointer pr-9" />
            <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-bark-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" /></svg>
          </div>
        </div>
        <div>
          <label className="label">주소</label>
          <div className="flex gap-2">
            <input
              name={names.address1}
              value={addr1}
              readOnly
              required={required}
              onClick={openSearch}
              onInvalid={(e) => (e.currentTarget as HTMLInputElement).setCustomValidity("주소 검색으로 주소를 선택해 주세요.")}
              onInput={(e) => (e.currentTarget as HTMLInputElement).setCustomValidity("")}
              placeholder="도로명·건물명·지번으로 검색"
              className="input cursor-pointer"
            />
            <button type="button" onClick={openSearch} className="btn-primary shrink-0 px-4">
              주소 검색
            </button>
          </div>
        </div>
      </div>
      <div>
        <label className="label">상세 주소</label>
        <input ref={detailRef} name={names.address2} defaultValue={defaults.address2} placeholder="동·호수 등 나머지 주소" className="input" />
      </div>
      {err && <p className="text-xs text-rose-600">{err} 잠시 후 다시 시도해 주세요.</p>}

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center" onClick={() => setOpen(false)}>
          <div className="flex h-[85dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.75rem] bg-white shadow-2xl sm:h-[600px] sm:rounded-[1.75rem]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-hanji-200 px-5 py-4">
              <div>
                <p className="font-extrabold text-bark-900">주소 검색</p>
                <p className="text-xs text-bark-400">예: 테헤란로 152, 역삼동 737, 강남파이낸스센터</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full text-bark-500 hover:bg-hanji-100" aria-label="닫기">
                ✕
              </button>
            </div>
            <div ref={boxRef} className="min-h-0 flex-1">
              <p className="p-6 text-center text-sm text-bark-400">불러오는 중…</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
