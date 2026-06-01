import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Readiness Assessment | Clinovyr",
  description:
    "Assess your business AI readiness with Clinovyr — AI consulting for Placer County businesses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${instrumentSans.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
