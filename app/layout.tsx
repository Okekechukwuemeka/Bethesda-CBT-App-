import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AuthSessionProvider from "@/components/providers/SessionProvider";
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
  title: {
    template: "%s | Bethesda Home & School For The Blind",
    default: "Bethesda Home & School For The Blind - CBT Platform",
  },
  description:
    "Computer-Based Testing platform for Bethesda Home & School For The Blind. Accessible, inclusive, and designed for visually impaired students.",
  keywords: [
    "Bethesda Home",
    "School For The Blind",
    "CBT",
    "Computer-Based Testing",
    "Online Examination",
    "Accessible Education",
    "Visually Impaired",
    "Inclusive Education",
    "Nigeria",
    "Examination Platform",
  ],
  authors: [
    {
      name: "Bethesda Home & School For The Blind",
    },
  ],
  creator: "Bethesda Home & School For The Blind",
  publisher: "Bethesda Home & School For The Blind",
  applicationName: "Bethesda CBT Platform",
  formatDetection: {
    telephone: false,
  },
  metadataBase: new URL("https://bethesdacbt.org"),
  openGraph: {
    title: "Bethesda Home & School For The Blind - CBT Platform",
    description: "Accessible Computer-Based Testing platform for visually impaired students.",
    url: "https://bethesdacbt.org",
    siteName: "Bethesda CBT Platform",
    locale: "en_NG",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Bethesda Home & School For The Blind - CBT Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bethesda Home & School For The Blind - CBT Platform",
    description: "Accessible Computer-Based Testing platform for visually impaired students.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#1A3A5C",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#E8F0FE]">
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
