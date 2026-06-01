import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Mono, Instrument_Sans } from "next/font/google";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const dmMono = DM_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Industry AI Playbooks | Clinovyr",
  description:
    "Industry-specific AI implementation playbooks from Clinovyr — practical guides for Placer County businesses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${instrumentSans.variable} ${cormorant.variable} ${dmMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
