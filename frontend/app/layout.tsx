import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Providers } from './providers';
// Import CSS - must be at the top level for proper HMR
import '../src/index.css'; // Legacy styles (being phased out)
import '../src/styles/globals-new.css'; // New Figma design system

export const metadata: Metadata = {
  title: 'Travel Assistant - Itinerary Planner',
  description: 'AI-powered itinerary planner for travelers with DMC control',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#000000', // Using black to match the design system
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        {/* Fonts are now loaded via @import in globals-new.css for better performance */}
      </head>
      <body className={GeistSans.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
