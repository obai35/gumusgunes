import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { DesignProvider } from "@/components/store/DesignProvider";
import EditModeGate from "@/components/store/EditModeGate";
import { AuthHydrator } from "@/components/store/AuthHydrator";
import { NavigationProgress } from "@/components/ui/NavigationProgress";
import { PageViewWrapper } from "@/components/ui/PageViewWrapper";
import { StorefrontEffects } from "@/components/store/StorefrontEffects";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://gumusgunes.com'),
  title: {
    default: "Gümüş Güneş — Silver Sun Accessories | Handcrafted Stainless Steel",
    template: "%s — Gümüş Güneş",
  },
  description:
    "Gümüş Güneş (Silver Sun) — handcrafted premium stainless steel accessories. Rings, necklaces, earrings, bracelets and pendants inspired by the sun, moon, and stars.",
  keywords: [
    "Gümüş Güneş",
    "Silver Sun",
    "stainless steel accessories",
    "steel rings",
    "steel necklaces",
    "diamond accessories",
    "Turkish jewelry",
    "luxury accessories",
  ],
  authors: [{ name: "Gümüş Güneş" }],
  icons: {
    icon: "/gumusgunes-logo.jpeg",
  },
  openGraph: {
    title: "Gümüş Güneş — Silver Sun Accessories",
    description: "Handcrafted premium stainless steel accessories inspired by the sun, moon, and stars.",
    siteName: "Gümüş Güneş",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@gumusgunes",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#0a1628',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://js.stripe.com" />
        <link rel="preconnect" href="https://www.paypal.com" />
        <link rel="preconnect" href="https://accounts.google.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Gümüş Güneş",
              url: "https://gumusgunes.com",
              logo: "https://gumusgunes.com/gumusgunes-logo.jpeg",
              sameAs: ["https://instagram.com/gumusgunes", "https://facebook.com/gumusgunes"],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              url: "https://gumusgunes.com",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: "https://gumusgunes.com/products?q={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} antialiased bg-background text-foreground`}
      >
        <StorefrontEffects />
        <NavigationProgress />
        <AuthHydrator />
        <DesignProvider>
          <PageViewWrapper>{children}</PageViewWrapper>
        </DesignProvider>
        <EditModeGate />
        <Toaster />
      </body>
    </html>
  );
}
