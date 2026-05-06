import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthGuard } from "@/components/AuthGuard";
import { LayoutContent } from "@/components/LayoutContent";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MailGard | Email Deliverability Intelligence",
  description: "Secure, controlled SMTP warm-up and AI risk management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-100 flex h-screen overflow-hidden`}>
        <AuthGuard>
          <LayoutContent>
            {children}
          </LayoutContent>
        </AuthGuard>
      </body>
    </html>
  );
}
