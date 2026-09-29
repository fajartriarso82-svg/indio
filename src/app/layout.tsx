import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const fontSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#0f172a",
};

export const metadata: Metadata = {
  title: "PT Inti Nusa Dinamika Optima - IT Solutions Partner",
  description: "Your trusted IT solutions partner in Cilacap. Specializing in IT product sales, service & maintenance, infrastructure, and security systems.",
  keywords: ["IT Cilacap", "IT Solutions", "Server Infrastructure", "CCTV Installation", "IT Service", "PT Inti Nusa Dinamika Optima", "Pertamina"],
  authors: [{ name: "PT Inti Nusa Dinamika Optima" }],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "INDO Portal",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
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
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
