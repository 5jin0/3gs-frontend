import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "판교패스",
    template: "%s | 판교패스",
  },
  description: "업무 중 마주치는 생소한 판교어를 검색하고 저장하세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark h-full antialiased">
      <body className="min-h-full bg-background text-foreground">
        <AuthProvider>
          <div className="min-h-full bg-background">
            <Header />
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
