import type { Metadata, Viewport } from 'next';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/hind-siliguri/400.css';
import '@fontsource/hind-siliguri/500.css';
import '@fontsource/hind-siliguri/600.css';
import '@fontsource/hind-siliguri/700.css';
import './globals.css';
import { AppProvider } from '@/components/app-provider';
import { SiteFooter, SiteHeader } from '@/components/site-shell';

export const metadata: Metadata = {
  title: { default: 'Bloodhelp — Sylhet Blood Donor Finder', template: '%s | Bloodhelp Sylhet' },
  description: 'A community-minded blood donor finder for Sylhet, Bangladesh. Connect with consenting donors and blood requests.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg', apple: '/icon-192.png' },
  appleWebApp: { capable: true, title: 'Bloodhelp', statusBarStyle: 'default' },
};
export const viewport: Viewport = { themeColor: '#d32f2f', width: 'device-width', initialScale: 1 };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning><body><AppProvider><SiteHeader /><main>{children}</main><SiteFooter /></AppProvider></body></html>;
}
