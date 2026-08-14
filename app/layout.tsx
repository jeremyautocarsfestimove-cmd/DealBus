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
  title: "DealBus — Transport en autocar, devis ou enchère",
  description:
    "Déposez votre trajet de groupe : recevez des devis détaillés ou lancez une enchère en direct entre transporteurs vérifiés et anonymes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${barlow.variable} ${plexMono.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
