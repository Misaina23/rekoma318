import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import type { ReactNode } from 'react'
import './globals.css'
import { Providers } from '@/components/providers/Providers'
import { ToastProvider } from '@/components/ui/toast'
import { RouteLayout } from '@/components/layout/RouteLayout'
import { JsonLd } from '@/components/seo/JsonLd'
import { GaScript } from '@/components/analytics/GaScript'
import { fr } from '@/lib/i18n'

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-manrope',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://rekoma-318.vercel.app'),
  title: fr.meta.title,
  viewport: {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fcfbf7' },
    { media: '(prefers-color-scheme: dark)', color: '#0d1713' },
  ],
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  description: fr.meta.description,
  keywords: ['REKOMA', 'Midongy Atsimo', 'Madagascar', 'développement local', 'entrepreneuriat', 'PDIMA', 'boutique', 'tee-shirt', 'polo'],
  openGraph: {
    title: fr.meta.title,
    description: fr.meta.description,
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${manrope.variable} min-h-screen bg-background font-sans selection:bg-primary/20`}>
        <JsonLd />
        <GaScript />
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Aller au contenu
        </a>
        <Providers>
          <ToastProvider>
            <RouteLayout>{children}</RouteLayout>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  )
}
