import type { Metadata } from "next";
import { Syne, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "SpendScope — AI Tool Cost Audit",
  description:
    "Find out in 2 minutes if you're overspending on AI tools. Free audit, no signup required.",
  openGraph: {
    title: "SpendScope — AI Tool Cost Audit",
    description:
      "Find out in 2 minutes if you're overspending on AI tools. Free audit, no signup required.",
    url: "https://spendscope.credex.rocks",
    siteName: "SpendScope",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "SpendScope — AI Tool Cost Audit",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SpendScope — AI Tool Cost Audit",
    description:
      "Find out in 2 minutes if you're overspending on AI tools. Free audit, no signup required.",
    images: ["/og-default.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="noise-bg">{children}</body>
    </html>
  );
}
