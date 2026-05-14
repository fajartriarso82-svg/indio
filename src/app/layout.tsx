import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PT Inti Nusa Dinamika Optima - IT Solutions Partner",
  description: "Your trusted IT solutions partner in Cilacap. Specializing in IT product sales, service & maintenance, infrastructure, and security systems.",
  keywords: ["IT Cilacap", "IT Solutions", "Server Infrastructure", "CCTV Installation", "IT Service", "PT Inti Nusa Dinamika Optima", "Pertamina"],
  authors: [{ name: "PT Inti Nusa Dinamika Optima" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "PT Inti Nusa Dinamika Optima - IT Solutions Partner",
    description: "Your trusted IT solutions partner in Cilacap. Specializing in IT product sales, service & maintenance, infrastructure, and security systems.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PT Inti Nusa Dinamika Optima - IT Solutions Partner",
    description: "Your trusted IT solutions partner in Cilacap.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
