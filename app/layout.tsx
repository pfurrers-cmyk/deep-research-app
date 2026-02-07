import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { AppProvider } from '@/components/providers/app-provider';
import { Header } from '@/components/layout/Header';
import { ArtifactsPanel } from '@/components/artifacts/ArtifactsPanel';
import { FloatingLogButton } from '@/components/debug/FloatingLogButton';
import { Toaster } from '@/components/ui/sonner';
import { CommandMenu } from '@/components/layout/CommandMenu';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
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
  description: 'Âmago.AI — Pesquisa profunda, chat com IA e geração de conteúdo',
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
        <NuqsAdapter>
          <ThemeProvider defaultTheme={APP_CONFIG.ui.defaultTheme}>
            <AppProvider>
              <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground">
                Pular para conteúdo principal
              </a>
              <Header />
              <main id="main-content" className="mx-auto max-w-5xl" tabIndex={-1}>{children}</main>
              <ArtifactsPanel />
              <FloatingLogButton />
              <CommandMenu />
              <Toaster position="bottom-right" richColors closeButton />
            </AppProvider>
          </ThemeProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
