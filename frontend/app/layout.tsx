import type { Metadata, Viewport } from 'next';
import { Providers } from './providers';
import '../src/index.css';

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
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
