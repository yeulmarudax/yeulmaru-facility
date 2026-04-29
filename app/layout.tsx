import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "율마루 시설팀 업무일지",
  description: "GS칼텍스 예울마루 시설팀 업무일지 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}