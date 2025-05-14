import type { Metadata } from "next";
import { Roboto, Geist_Mono, Damion, Martian_Mono } from "next/font/google";
import "./globals.css";

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
});

const limelight = Martian_Mono({
  weight: "400",
  variable: "--font-limelight",
});

export const metadata: Metadata = {
  title: "Fameish",
  description: "Become the most-followed person on Lens for a day",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${robotoSans.variable} ${geistMono.variable} ${damion.variable} ${limelight.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
