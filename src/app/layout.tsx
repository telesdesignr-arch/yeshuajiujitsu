import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";

import "./globals.css";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-barlow",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Yeshua Jiu-Jitsu",
    template: "%s · Yeshua Jiu-Jitsu",
  },
  description:
    "Academia de Jiu-Jitsu no Rio de Janeiro. Aulas para todas as idades e níveis, com o professor Renato Pierre. Acompanhe sua evolução, frequência e graduações.",
  applicationName: "Yeshua Jiu-Jitsu",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Yeshua JJ",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "Yeshua Jiu-Jitsu",
    description:
      "Jiu-Jitsu com Cristo. Aulas, graduações e acompanhamento de evolução para cada aluno.",
    type: "website",
    locale: "pt_BR",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#14100d",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <body>{children}</body>
    </html>
  );
}
