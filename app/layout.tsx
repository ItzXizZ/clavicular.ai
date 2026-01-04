import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clavicular.AI - Facial Analysis",
  description: "AI-powered facial analysis and improvement recommendations",
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
      </head>
      <body className={`${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
