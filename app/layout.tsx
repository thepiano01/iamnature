import "./globals.css";
import type { Metadata, Viewport } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: { default: "나는 자연산이다 — 산에서 캔 나물·약초 직거래", template: "%s | 나는 자연산이다" },
  description: "채취자가 산에서 직접 캔 나물·약초·버섯을 내 건강상태에 맞춰 추천받고 구매하는 자연산 직거래 플랫폼",
};

export const viewport: Viewport = { themeColor: "#f8faf9", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      </head>
      <body className="min-h-dvh">
        <SiteHeader />
        <main className="pb-28 md:pb-0">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
