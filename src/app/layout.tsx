// src/app/layout.tsx
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '../components/ThemeProvider'; // Adjust the path based on your file structure
import { AuthProvider } from '@/modules/auth/frontend/components/AuthProvider';
import { RootLayoutClient } from './layout.client';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <RootLayoutClient>{children}</RootLayoutClient>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}