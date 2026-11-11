import type { Metadata, Viewport } from "next";
import { siteConfig } from "@/config/site.config";
import { themeToCss } from "@/config/theme";
import { getSiteUrl } from "@/shared/site-url";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: siteConfig.name, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  // Navbar rozetli logosu (kaplan-badge-logo) — app/icon.png + public/favicon.ico
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
    shortcut: "/favicon.ico",
  },
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
        url: "/images/hero/hero-tursu-kavanozlar.webp",
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
    images: ["/images/hero/hero-tursu-kavanozlar.webp"],
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
    <html lang={siteConfig.locale} className="h-full antialiased">
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeToCss() }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
