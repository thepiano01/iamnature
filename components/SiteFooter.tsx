import Logo from "./Logo";
import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-hanji-200 bg-white pb-28 md:pb-0">
      <div className="container-x grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-sm text-sm leading-relaxed text-bark-500">산에서 직접 캔 나물과 약초를, 내 몸 상태에 맞춰 골라드려요.</p>
        </div>
        <div className="space-y-3 text-sm">
          <p className="font-bold text-bark-900">둘러보기</p>
          <ul className="space-y-2 text-bark-500">
            <li><Link href="/products" className="hover:text-forest-700">전체 상품</Link></li>
            <li><Link href="/match" className="hover:text-forest-700">건강 매칭</Link></li>
            <li><Link href="/register?role=SELLER" className="hover:text-forest-700">채취자로 입점하기</Link></li>
          </ul>
        </div>
        <div className="space-y-3 text-sm">
          <p className="font-bold text-bark-900">고객센터</p>
          <ul className="space-y-2 text-bark-500">
            <li>평일 10:00 – 17:00</li>
            <li><Link href="/orders" className="hover:text-forest-700">주문·배송 조회</Link></li>
            <li><Link href="/credits" className="hover:text-forest-700">사진 출처</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-hanji-100">
        <div className="container-x space-y-1.5 py-6 text-[11px] leading-relaxed text-bark-400">
          <p>※ 본 사이트의 상품은 의약품이 아닌 자연 식재료이며, 특정 질병의 예방·치료를 목적으로 하지 않습니다. 복용 중인 약이나 지병이 있다면 섭취 전 전문의와 상담하세요.</p>
          <p>© {new Date().getFullYear()} 나는 자연산이다</p>
        </div>
      </div>
    </footer>
  );
}
