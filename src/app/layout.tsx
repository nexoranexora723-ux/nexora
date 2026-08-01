import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/components/query-provider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const SITE_URL = "https://nexora-inky-mu.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "NEXORA — Importa desde China fácilmente",
    template: "%s | NEXORA",
  },
  description:
    "Plataforma inteligente de importación desde China. Tú eliges el producto, nosotros nos encargamos del resto: proveedores, logística, aduana y entrega en Colombia.",
  keywords: ["NEXORA", "importación", "China", "proveedores", "alibaba", "importar", "Colombia"],
  applicationName: "NEXORA",
  authors: [{ name: "NEXORA Importaciones S.A.S." }],
  creator: "NEXORA Importaciones S.A.S.",
  publisher: "NEXORA Importaciones S.A.S.",
  icons: {
    icon: [
      { url: "/icons/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icons/favicon.svg"],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: SITE_URL,
    siteName: "NEXORA",
    title: "NEXORA — Importa desde China fácilmente",
    description:
      "Tú eliges el producto. Nosotros nos encargamos del resto: buscar proveedores, negociar, comprar, importar y entregar.",
  },
  twitter: {
    card: "summary_large_image",
    title: "NEXORA — Importa desde China fácilmente",
    description:
      "Plataforma inteligente de importación desde China. Proveedores verificados, logística completa y proceso automatizado.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <QueryProvider>
            {children}
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
