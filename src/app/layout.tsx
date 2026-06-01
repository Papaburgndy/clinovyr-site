import type { Metadata, Viewport } from "next";
import {
  Cormorant_Garamond,
  DM_Mono,
  Instrument_Sans,
} from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import "./globals.css";

const fontDisplay = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const fontSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});

const fontMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-mono",
});

const description =
  "Clinovyr helps Roseville and Granite Bay businesses implement AI automation to save time, reduce costs, and outgrow competitors. AI consulting, workflow automation, and AI strategy for local SMBs.";

export const metadata: Metadata = {
  metadataBase: new URL("https://clinovyr.com"),
  title: {
    default: "Clinovyr — AI Consulting for Placer County Businesses",
    template: "%s | Clinovyr",
  },
  description,
  keywords: [
    "AI consulting Roseville CA",
    "AI consulting Granite Bay",
    "business automation Placer County",
    "AI strategy Sacramento",
    "workflow automation small business",
  ],
  authors: [{ name: "Clinovyr" }],
  openGraph: {
    title: "Clinovyr — AI Consulting for Placer County Businesses",
    description,
    url: "https://clinovyr.com",
    siteName: "Clinovyr",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clinovyr — AI Consulting for Placer County Businesses",
    description,
  },
  robots: { index: true, follow: true },
  alternates: {
    canonical: "https://clinovyr.com",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable}`}
    >
      <body className="bg-paper text-ink antialiased">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
