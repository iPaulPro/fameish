import type { Metadata } from "next";
import { ReactNode } from "react";
import { Roboto, Geist_Mono, Martian_Mono, Inter_Tight } from "next/font/google";
import "./globals.css";
import Providers from "@/app/providers";
import { Analytics } from "@vercel/analytics/next";

const robotoSans = Roboto({
  variable: "--font-roboto-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const limelight = Martian_Mono({
  weight: "400",
  variable: "--font-limelight",
  subsets: ["latin"],
});

const hero = Inter_Tight({
  weight: "600",
  variable: "--font-hero",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fameish",
  description: "Become the most-followed person on Lens, for a day",
  icons: {
    icon: "/images/fameish-icon.svg",
  },
  openGraph: {
    title: "Fameish",
    description: "Become the most-followed person on Lens, for a day",
    url: "https://fameish.day",
    siteName: "Fameish",
    images: [
      {
        url: "https://fameish.day/images/og-image.webp",
        width: 1500,
        height: 768,
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${robotoSans.variable} ${geistMono.variable} ${limelight.variable} ${hero.variable} antialiased`}
      >
        <div className="min-h-full gradient-bg font-sans flex flex-col">
          <Providers>
            {children}
            <Analytics />
          </Providers>
        </div>
      </body>
    </html>
  );
}
