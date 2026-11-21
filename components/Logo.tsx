import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2" aria-label="나는 자연산이다 홈">
      <span className="relative grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-forest-500 to-forest-800 text-white shadow-[0_6px_16px_-6px_rgb(15_118_110/0.7)]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21c0-6 3-10 8-12-1 6-4 10-8 12Z" />
          <path d="M12 21C12 15 9 11 4 9c1 6 4 10 8 12Z" />
          <path d="M12 21V8" />
        </svg>
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-clay-500 ring-2 ring-white" />
      </span>
      <span className="text-[17px] font-extrabold tracking-[-0.03em] text-bark-900">
        나는<span className="text-forest-700">자연산</span>이다
      </span>
    </Link>
  );
}
