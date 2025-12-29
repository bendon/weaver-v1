import type { Metadata } from 'next';
import { Providers } from './providers';
import '../src/index.css';

export const metadata: Metadata = {
  title: 'Travel Assistant - Itinerary Planner',
  description: 'AI-powered itinerary planner for travelers with DMC control',
  manifest: '/manifest.json',
  themeColor: '#0073E6',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
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
