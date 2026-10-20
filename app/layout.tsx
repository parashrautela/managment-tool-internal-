import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PwaProvider } from '../components/pwa-provider';

export const metadata: Metadata = {
  title: 'Flowboard — Make room for great work',
  description: 'Your projects, people, and priorities. One thoughtfully organized workspace.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Flowboard',
  },
  applicationName: 'Flowboard',
};

export const viewport: Viewport = {
  themeColor: '#7760da',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body>
        <PwaProvider>{children}</PwaProvider>
      </body>
    </html>
  );
}
