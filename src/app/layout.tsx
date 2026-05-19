import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Secretaría de Energía · Fuerza del Pueblo",
  description: "Propuestas, análisis y visión estratégica para el futuro energético de la República Dominicana. Portal oficial de la Secretaría de Energía de Fuerza del Pueblo.",
  metadataBase: new URL("https://energia-fp.netlify.app"),
  openGraph: {
    title: "Secretaría de Energía · Fuerza del Pueblo",
    description: "Propuestas, análisis y visión estratégica para el futuro energético de la República Dominicana.",
    url: "https://energia-fp.netlify.app",
    siteName: "Secretaría de Energía FP",
    images: [
      {
        url: "/og-image.jpg",
        width: 1344,
        height: 768,
        alt: "Secretaría de Energía — Fuerza del Pueblo",
      },
    ],
    locale: "es_DO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Secretaría de Energía · Fuerza del Pueblo",
    description: "Propuestas, análisis y visión estratégica para el futuro energético de la República Dominicana.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: "/fp-logo.png",
    apple: "/fp-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className={`${inter.variable} ${playfair.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
