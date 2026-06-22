import type { Metadata } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Gümüş Güneş — Silver Sun Jewelry | Handcrafted Sterling Silver",
  description:
    "Gümüş Güneş (Silver Sun) — handcrafted 925 sterling silver jewelry. Rings, necklaces, earrings, bracelets and pendants inspired by the sun, moon, and stars.",
  keywords: [
    "Gümüş Güneş",
    "Silver Sun",
    "sterling silver jewelry",
    "silver rings",
    "silver necklaces",
    "diamond jewelry",
    "Turkish jewelry",
    "luxury jewelry",
  ],
  authors: [{ name: "Gümüş Güneş" }],
  icons: {
    icon: "/gumusgunes-logo.jpeg",
  },
  openGraph: {
    title: "Gümüş Güneş — Silver Sun Jewelry",
    description: "Handcrafted 925 sterling silver jewelry inspired by the sun, moon, and stars.",
    siteName: "Gümüş Güneş",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
