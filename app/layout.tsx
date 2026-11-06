import type { Metadata } from "next";
import { Literata, Nunito_Sans } from "next/font/google";
import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";

const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin"],
});

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QRBid — Simple auctions, shared by QR code",
  description:
    "Create a time-limited auction and share its link or QR code. No public marketplace required.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="light"
      className={`${literata.variable} ${nunitoSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
