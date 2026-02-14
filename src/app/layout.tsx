import type { Metadata } from "next";
import { Bebas_Neue, IBM_Plex_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const displayFont = Bebas_Neue({
  variable: "--font-bebas-neue",
  subsets: ["latin"],
  weight: "400",
});

const bodyFont = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

const uiFont = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Headstash",
    template: "%s · Headstash",
  },
  description: "Log cannabis strain reviews — simple, mobile-first.",
  applicationName: "Headstash",
  metadataBase: new URL("https://github.com/michaelasper/headstash"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${displayFont.variable} ${bodyFont.variable} ${uiFont.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
