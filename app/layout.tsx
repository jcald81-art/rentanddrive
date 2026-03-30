// Root layout for Rent and Drive - Updated 2026-03-30
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import Script from 'next/script'
import { Concierge } from '@/components/concierge'
import { ErrorBoundary } from '@/components/error-boundary'
import { CookieConsent } from '@/components/cookie-consent'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rentanddrive.net'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Rent and Drive | Premium AWD Car Rental Reno Lake Tahoe Nevada',
    template: '%s | Rent and Drive',
  },
  description: 'Book direct and save 10% vs Turo. Premium AWD car rental in Reno and Lake Tahoe, Nevada. Subarus, trucks, SUVs with snow tires. Contactless pickup, VIN verified vehicles, 24/7 local support.',
  keywords: [
    'car rental Reno',
    'car rental Lake Tahoe',
    'AWD rental Nevada',
    'Subaru rental Tahoe',
    'ski trip car rental',
    'peer to peer car rental',
    'P2P car rental',
    'Turo alternative',
    'truck rental Reno',
    'SUV rental Nevada',
    'P2PCR',
    'car sharing Reno',
    'private car rental Nevada',
    'contactless car rental',
  ],
  authors: [{ name: 'Rent and Drive LLC' }],
  creator: 'Rent and Drive LLC',
  publisher: 'Rent and Drive LLC',
  generator: 'Next.js',
  applicationName: 'Rent and Drive',
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName: 'Rent and Drive',
    title: 'Rent and Drive | Premium AWD Car Rental Reno Lake Tahoe Nevada',
    description: 'Book direct and save 10% vs Turo. Premium AWD car rental in Reno and Lake Tahoe. Contactless pickup, VIN verified vehicles.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Rent and Drive - Premium Car Rental in Reno and Lake Tahoe',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rent and Drive | Premium AWD Car Rental Reno Lake Tahoe Nevada',
    description: 'Book direct and save 10% vs Turo. Premium AWD car rental in Reno and Lake Tahoe.',
    images: ['/og-image.jpg'],
    creator: '@rentanddrive',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: baseUrl,
  },
  category: 'transportation',
}

export const viewport: Viewport = {
  themeColor: '#CC0000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  colorScheme: 'light dark',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        {/* PWA Meta Tags */}
        <meta name="application-name" content="Rent and Drive" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="R&D" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#CC0000" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Google Search Console Verification */}
        {process.env.GOOGLE_SITE_VERIFICATION && (
          <meta name="google-site-verification" content={process.env.GOOGLE_SITE_VERIFICATION} />
        )}
        
        {/* Preconnect to external domains for Core Web Vitals */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cqajtlycmxqbpxvmjzey.supabase.co" />
        <link rel="preconnect" href="https://js.stripe.com" />
        <link rel="preconnect" href="https://api.twilio.com" />
        <link rel="dns-prefetch" href="https://cqajtlycmxqbpxvmjzey.supabase.co" />
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        
        {/* Cloudflare Web Analytics */}
        {process.env.CF_ANALYTICS_TOKEN && (
          <Script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={`{"token": "${process.env.CF_ANALYTICS_TOKEN}"}`}
            strategy="afterInteractive"
          />
        )}
      </head>
      <body className="font-sans antialiased">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
<Concierge />
<CookieConsent />
<Analytics />
        
        {/* Service Worker Registration */}
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(registration) {
                    console.log('SW registered: ', registration.scope);
                  },
                  function(err) {
                    console.log('SW registration failed: ', err);
                  }
                );
              });
            }
          `}
        </Script>
      </body>
    </html>
  )
}
