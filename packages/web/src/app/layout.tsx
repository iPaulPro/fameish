import type { Metadata } from "next";
import { ReactNode } from "react";
import { Roboto, Geist_Mono, Martian_Mono, Inter_Tight } from "next/font/google";
import "./globals.css";
import Providers from "@/app/providers";

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
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
