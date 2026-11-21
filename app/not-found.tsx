import Link from "next/link";
import ProductArt from "@/components/ProductArt";

export default function NotFound() {
  return (
    <div className="container-x flex flex-col items-center gap-4 py-24 text-center">
      <ProductArt category="MUSHROOM" className="h-24 w-24 rounded-3xl" />
      <h1 className="h-serif text-3xl">길을 잃으셨나요?</h1>
      <p className="text-sm text-bark-500">찾으시는 페이지가 산속 깊이 숨어버렸어요.</p>
      <Link href="/" className="btn-primary">홈으로</Link>
    </div>
  );
}
