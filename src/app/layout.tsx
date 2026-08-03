import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/components/query-provider";
import { GoogleAnalytics } from "@/components/google-analytics";
import { WhatsAppFloating } from "@/components/nexora/public/whatsapp-floating";
import { AiChatbot } from "@/components/nexora/public/ai-chatbot";

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
      { url: "/icons/logo-official.png", type: "image/png" },
      { url: "/icons/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/icons/logo-official.png"],
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Schema.org JSON-LD: Organization schema for NEXORA
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "NEXORA",
    "legalName": "NEXORA Importaciones S.A.S.",
    "url": SITE_URL,
    "logo": `${SITE_URL}/icons/icon-512.png`,
    "description": "Plataforma inteligente de importación desde China. Tú eliges el producto, nosotros nos encargamos del resto: proveedores, logística, aduana y entrega en Colombia.",
    "foundingDate": "2024",
    "areaServed": "CO",
    "knowsLanguage": ["es", "en"],
    "email": "hola@nexora.co",
    "contactPoint": [{
      "@type": "ContactPoint",
      "telephone": "+57-300-000-0000",
      "contactType": "customer service",
      "areaServed": "CO",
      "availableLanguage": ["Spanish", "English"],
    }],
    "sameAs": [
      "https://www.instagram.com/nexora",
      "https://www.facebook.com/nexora",
      "https://twitter.com/nexora",
    ],
  };

  // Schema.org JSON-LD: WebSite schema (enables sitelinks search box etc.)
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "NEXORA",
    "url": SITE_URL,
    "inLanguage": "es-CO",
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${SITE_URL}/?view=catalog&q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <QueryProvider>
            {children}
            <Toaster />
            {/* WhatsApp floating button — visible on ALL routes */}
            <WhatsAppFloating />
            {/* AI Chatbot — visible on ALL routes */}
            <AiChatbot />
          </QueryProvider>
        </ThemeProvider>
        {/* Google Analytics 4 — solo carga si NEXT_PUBLIC_GA_ID está configurado */}
        <GoogleAnalytics />
        {/* Schema.org structured data — Organization + WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </body>
    </html>
  );
}
