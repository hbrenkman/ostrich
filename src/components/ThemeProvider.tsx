// src/components/ThemeProvider.tsx
"use client";

import { useEffect, useState } from 'react';
import { ThemeProvider as NextThemeProvider } from 'next-themes';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={true}
    >
      {children}
    </NextThemeProvider>
  );
}