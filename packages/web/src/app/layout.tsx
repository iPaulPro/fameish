import type { Metadata } from "next";
import { ReactNode } from "react";
import { Roboto, Geist_Mono, Damion, Martian_Mono } from "next/font/google";
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

const damion = Damion({
  weight: "400",
  variable: "--font-damion",
  subsets: ["latin"],
});

const limelight = Martian_Mono({
  weight: "400",
  variable: "--font-limelight",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fameish",
  description: "Become the most-followed person on Lens for a day",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${robotoSans.variable} ${geistMono.variable} ${damion.variable} ${limelight.variable} antialiased`}
      >
        <div className="w-full h-screen gradient-bg font-sans">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
