import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { AppProvider } from '@/components/providers/app-provider';
import { Header } from '@/components/layout/Header';
import { ArtifactsPanel } from '@/components/artifacts/ArtifactsPanel';
import { FloatingLogButton } from '@/components/debug/FloatingLogButton';
import { Toaster } from '@/components/ui/sonner';
import { APP_CONFIG } from '@/config/defaults';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: APP_CONFIG.app.name,
  description: 'Ferramenta pessoal de pesquisa profunda automatizada',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={APP_CONFIG.app.locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider defaultTheme={APP_CONFIG.ui.defaultTheme}>
          <AppProvider>
            <Header />
            <main className="mx-auto max-w-5xl">{children}</main>
            <ArtifactsPanel />
            <FloatingLogButton />
            <Toaster position="bottom-right" richColors closeButton />
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
