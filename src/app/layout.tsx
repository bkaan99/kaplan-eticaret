import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono, Montserrat } from "next/font/google";
import { siteConfig } from "@/config/site.config";
import { themeToCss } from "@/config/theme";
import { getSiteUrl } from "@/shared/site-url";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

/** Vitrin gövde yazı tipi (yönetim paneli Geist kalır) */
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "latin-ext"],
});

/** Başlıklar için serif yazı tipi (vitrin) */
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"],
  axes: ["SOFT", "opsz"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: siteConfig.name, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  keywords: [
    "turşu",
    "çubuk turşusu",
    "ev turşusu",
    "doğal fermente",
    "şalgam suyu",
    "probiyotik turşu",
    "kaplan turşu",
    "ankara turşu",
  ],
  alternates: {
    canonical: "./",
  },
  openGraph: {
    siteName: siteConfig.name,
    locale: "tr_TR",
    type: "website",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [
      {
        url: "/images/hero/hero-tursu-kavanozlar.jpg",
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} - Doğal Fermente Ev Turşuları`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: ["/images/hero/hero-tursu-kavanozlar.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang={siteConfig.locale}
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} ${montserrat.variable} h-full antialiased`}
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeToCss() }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
