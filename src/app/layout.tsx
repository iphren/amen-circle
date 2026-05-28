import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://amen.ihs.technology"),
  title: {
    default: "Amen Circle",
    template: "%s · Amen Circle",
  },
  description:
    "Small circles of trusted friends, lifting each other up in prayer. Passkey-only sign-in; confidential requests stay encrypted end-to-end.",
  applicationName: "Amen Circle",
  openGraph: {
    type: "website",
    siteName: "Amen Circle",
    title: "Amen Circle",
    description:
      "Small circles of trusted friends, lifting each other up in prayer.",
    url: "/",
  },
  twitter: {
    card: "summary",
    title: "Amen Circle",
    description:
      "Small circles of trusted friends, lifting each other up in prayer.",
  },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
