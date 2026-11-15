import { Suspense } from "react";
import { AideWidget } from "@/components/AideWidget";
import type { Metadata } from "next";
import { Barlow_Condensed, IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";

const barlow = Barlow_Condensed({
  weight: ["600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-barlow",
});
const plexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-plex-mono",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL("https://dealbus.fr"),
  title: {
    default: "DealBus — Location d'autocar avec chauffeur : devis comparés de transporteurs vérifiés",
    template: "%s · DealBus",
  },
  description:
    "Réservez un autocar avec chauffeur pour votre groupe : une seule demande, des devis fermes de transporteurs vérifiés à comparer. Gratuit pour le client.",
  keywords: ["location autocar", "réserver un bus", "devis autocar", "location bus avec chauffeur", "transport de groupe", "comparateur autocar"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://dealbus.fr",
    siteName: "DealBus",
    title: "DealBus — La place de marché du transport de groupe",
    description:
      "Une seule demande, des devis fermes à comparer : le transport de groupe en autocar, avec des transporteurs vérifiés.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "DealBus — la place de marché du transport de groupe" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "DealBus — La place de marché du transport de groupe",
    description: "Une seule demande, des devis fermes de transporteurs vérifiés à comparer.",
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${barlow.variable} ${plexMono.variable} ${inter.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": "https://dealbus.fr/#org",
                name: "DealBus",
                url: "https://dealbus.fr",
                logo: "https://dealbus.fr/og.png",
                email: "contact@dealbus.fr",
                description: "Place de marché du transport de groupe en autocar : devis comparés entre clients et transporteurs vérifiés.",
              },
              {
                "@type": "WebSite",
                "@id": "https://dealbus.fr/#site",
                url: "https://dealbus.fr",
                name: "DealBus",
                publisher: { "@id": "https://dealbus.fr/#org" },
                inLanguage: "fr-FR",
              },
              {
                "@type": "Service",
                name: "Location d'autocar avec chauffeur — mise en relation",
                provider: { "@id": "https://dealbus.fr/#org" },
                serviceType: "Mise en relation pour le transport de groupe (autocar, minibus, VTC, taxi)",
                areaServed: "FR",
                offers: { "@type": "Offer", price: "0", priceCurrency: "EUR", description: "Publication de demande gratuite pour les clients" },
              },
            ],
          }) }}
        />
        {children}
        <Suspense><AideWidget /></Suspense>
      </body>
    </html>
  );
}
