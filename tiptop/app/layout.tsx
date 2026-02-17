import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: {
    default: 'TipTop — Your reputation travels with you',
    template: '%s | TipTop',
  },
  description: 'Build a portable professional reputation through verified customer reviews. Your TipTop profile follows you from job to job.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://tiptop.report'),
  openGraph: {
    type: 'website',
    siteName: 'TipTop',
    title: 'TipTop — Your reputation travels with you',
    description: 'Build a portable professional reputation through verified customer reviews.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TipTop — Your reputation travels with you',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#0f172a',
              color: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #1e293b',
              fontFamily: 'var(--font-body)',
            },
            success: {
              iconTheme: { primary: '#14b8a6', secondary: '#f8fafc' },
            },
            error: {
              iconTheme: { primary: '#f87171', secondary: '#f8fafc' },
            },
          }}
        />
      </body>
    </html>
  )
}
