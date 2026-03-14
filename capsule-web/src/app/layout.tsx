import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Capsule',
  description: 'Organize YouTube videos into nested folders',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={`${inter.className} bg-[#0A0A0A] text-[#E8E8E8] min-h-screen`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}