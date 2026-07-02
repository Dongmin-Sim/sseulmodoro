import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono, Silkscreen } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// 영문·숫자 본문/제목 (DESIGN.md)
const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

// 픽셀 폰트 — 로고·eyebrow 라벨·대문자 마이크로 라벨 전용 (DESIGN.md). 가변 폰트 아님 → weight 명시
const silkscreen = Silkscreen({
  variable: "--font-silkscreen",
  subsets: ["latin"],
  weight: ["400", "700"],
});

// 한글 본문/제목 — Pretendard (self-host 가변 폰트). Plus Jakarta Sans에 한글 글리프 없음
const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
});

// 타이머 숫자 전용 (DESIGN.md: Timer = Geist Mono)
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "쓸모도로 — 집중하면 캐릭터가 자란다",
  description: "포모도로 타이머 + 캐릭터 수집 + 데이터 파이프라인",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${plusJakarta.variable} ${pretendard.variable} ${geistMono.variable} ${silkscreen.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
