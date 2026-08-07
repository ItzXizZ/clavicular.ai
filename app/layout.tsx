import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Clavicular.AI | Face Rating, Fashion & Physique Protocol",
    template: "%s | Clavicular.AI",
  },
  description:
    "AI face rating with Softmax/Hardmax protocol, fashion advice, physique suggestions, and before/after transforms. Free scan. Unlock Premium with a 7-day trial.",
  keywords: [
    "face rating",
    "looksmaxxing",
    "facial analysis",
    "fashion advice",
    "physique advice",
    "softmax",
    "hardmax",
    "AI beauty",
    "Clavicular AI",
  ],
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://clavicular.ai"
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Clavicular.AI",
    title: "Clavicular.AI | Face Rating, Fashion & Physique Protocol",
    description:
      "Find out where you really stand. Free AI face scan, then fashion, physique, and a protocol built to close the gap.",
    images: [
      {
        url: "/marketing/hero-og.png",
        width: 1200,
        height: 630,
        alt: "Clavicular.AI: free face rating, fashion, physique, and Premium protocol",
      },
      {
        url: "/transformation.png",
        width: 1200,
        height: 630,
        alt: "Clavicular.AI facial transformation before and after",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Clavicular.AI | Face Rating, Fashion & Physique Protocol",
    description:
      "Free AI face rating. Unlock fashion advice, physique suggestions, Softmax/Hardmax protocol, and AI before/after.",
    images: ["/marketing/hero-og.png"],
  },
  icons: {
    icon: "/black-white-icon-hooded-man-600nw-2631452863.webp",
    shortcut: "/black-white-icon-hooded-man-600nw-2631452863.webp",
    apple: "/black-white-icon-hooded-man-600nw-2631452863.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@700,500,400&display=swap"
          rel="stylesheet"
        />
        {/* Google AdSense */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5633162123365401"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className={`${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
