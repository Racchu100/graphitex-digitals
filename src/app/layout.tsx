import type { Metadata } from "next";
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
  title: {
    default: "Graphitex Digitals | Premium Business & Creator Marketplace",
    template: "%s | Graphitex Digitals",
  },
  description: "Discover trusted local businesses, connect with verified creators and influencers, and scale your brand with professional marketing, web development, and design services on Graphitex Digitals.",
  keywords: [
    "Graphitex Digitals",
    "creative marketplace",
    "local business directory",
    "influencer marketing",
    "creator collaborations",
    "Mangalore businesses",
    "digital marketing agency",
    "advertising & promotional shoots",
    "web development services",
    "graphic design services",
    "social media page management"
  ],
  authors: [{ name: "Graphitex Digitals", url: "https://www.graphitexdigitals.com" }],
  creator: "Graphitex Digitals",
  publisher: "Graphitex Digitals",
  metadataBase: new URL("https://www.graphitexdigitals.com"),
  openGraph: {
    title: "Graphitex Digitals | Premium Business & Creator Marketplace",
    description: "Discover trusted local businesses, connect with verified creators and influencers, and scale your brand with professional marketing, web development, and design services on Graphitex Digitals.",
    url: "https://www.graphitexdigitals.com",
    siteName: "Graphitex Digitals",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Graphitex Digitals Marketplace",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Graphitex Digitals | Premium Business & Creator Marketplace",
    description: "Discover trusted local businesses, connect with verified creators and influencers, and scale your brand with professional marketing, web development, and design services on Graphitex Digitals.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Graphitex Digitals",
  "url": "https://www.graphitexdigitals.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://www.graphitexdigitals.com/services?search={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
