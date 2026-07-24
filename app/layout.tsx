import type { Metadata, Viewport } from 'next';
import { Inter, Vazirmatn } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import AuthProvider from './AuthProvider';
import SupportModal from '@/components/ui/SupportModal';
import './globals.css';

// Fonts
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
});

const vazirmatn = Vazirmatn({
  subsets: ['arabic'],
  display: 'swap',
  variable: '--font-vazirmatn',
  preload: true,
  weight: ['400', '500', '600', '700'],
});

// ============================================================
// DYNAMIC BASE URL - Never hardcodes localhost
// ============================================================
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://ai-vision-official.vercel.app');

// ============================================================
// METADATA
// ============================================================
export const metadata: Metadata = {
  title: {
    default: 'AIVision - AI-Powered Multi-Lingual Platform',
    template: '%s | AIVision',
  },
  description:
    'Advanced AI text generation, translation, and grammar correction across 12 languages with specialized Kurdish dialect support. Built by Zaniyar Al-Mzurii.',
  metadataBase: new URL(APP_URL),
  keywords: [
    'AI translation',
    'Kurdish AI',
    'multilingual AI',
    'text generation',
    'grammar correction',
    'Badini Kurdish',
    'Sorani Kurdish',
    'Zaniyar Al-Mzurii',
    'AIVision',
  ],
  authors: [{ name: 'Zaniyar Al-Mzurii', url: 'https://t.me/z_14x' }],
  creator: 'Zaniyar Al-Mzurii',
  publisher: 'AIVision Technologies',
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: APP_URL,
    siteName: 'AIVision',
    title: 'AIVision - AI-Powered Multi-Lingual Platform',
    description: 'Advanced AI text generation, translation, and grammar correction across 12 languages.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AIVision Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AIVision - AI-Powered Multi-Lingual Platform',
    description: 'Advanced AI text generation across 12 languages.',
    images: ['/og-image.png'],
    creator: '@aivision',
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
  alternates: {
    canonical: APP_URL,
    languages: {
      en: `${APP_URL}?lang=EN`,
      ar: `${APP_URL}?lang=AR`,
      tr: `${APP_URL}?lang=TR`,
      'ku-bd': `${APP_URL}?lang=KU-BD`,
    },
  },
};

// ============================================================
// VIEWPORT
// ============================================================
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#090D16',
  colorScheme: 'dark',
};

// ============================================================
// ROOT LAYOUT
// ============================================================
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AIVision" />
        <meta name="msapplication-TileColor" content="#090D16" />
        <meta name="theme-color" content="#090D16" />
      </head>
      <body className={`${inter.variable} ${vazirmatn.variable} font-sans`}>
        <AuthProvider>
          {children}
          <SupportModal />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--bg-surface)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '14px',
                padding: '12px 16px',
                fontSize: '14px',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
