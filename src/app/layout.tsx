import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Jamia Laundry Management System',
  description: 'Clothes Collection, Thermal Mini Receipt Printing, Billing and Reporting for Jamia Madrasa',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ur" dir="rtl">
      <body className="bg-slate-50 text-slate-900 font-sans antialiased min-h-screen">
        <AppProvider>
          <Navbar />
          <main className="min-h-[calc(100vh-120px)]">{children}</main>
        </AppProvider>
      </body>
    </html>
  );
}
