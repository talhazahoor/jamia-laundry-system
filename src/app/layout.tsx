import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import AppLayout from '@/components/AppLayout';

export const metadata: Metadata = {
  title: 'Laundry Portal',
  description: 'Clothes Collection, Thermal Mini Receipt Printing, Billing and Reporting',
  icons: {
    icon: '/logos/laundry-logo.png',
    shortcut: '/logos/laundry-logo.png',
    apple: '/logos/laundry-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className="bg-slate-50 text-slate-900 font-sans antialiased min-h-screen">
        <AppProvider>
          <AppLayout>{children}</AppLayout>
        </AppProvider>
      </body>
    </html>
  );
}
