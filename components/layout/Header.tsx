'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, BookOpen, Settings, Menu, X, ImageIcon, Swords } from 'lucide-react';
import { useState } from 'react';
import { APP_CONFIG } from '@/config/defaults';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { VersionStamp } from '@/components/layout/VersionStamp';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Pesquisa', icon: Search },
  { href: '/generate', label: 'Imagens', icon: ImageIcon },
  { href: '/arena', label: 'Arena', icon: Swords },
  { href: '/library', label: 'Biblioteca', icon: BookOpen },
  { href: '/settings', label: 'Config', icon: Settings },
] as const;

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full glass-header">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <Search className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-bold">{APP_CONFIG.app.name}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 sm:flex" aria-label="Navegação principal">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors',
                  isActive
                    ? 'bg-accent font-medium text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <link.icon className="h-3.5 w-3.5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
            className="hidden sm:flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-border/50 bg-muted/30 text-xs text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Abrir paleta de comandos"
          >
            <Search className="w-3 h-3" />
            <span>Buscar...</span>
            <kbd className="ml-1.5 pointer-events-none rounded border bg-muted px-1 font-mono text-[10px]">⌘K</kbd>
          </button>
          <VersionStamp />
          <ThemeToggle />
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-input text-muted-foreground sm:hidden"
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="flex flex-col border-t border-border bg-background px-4 py-2 sm:hidden" aria-label="Navegação mobile">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2.5 text-sm transition-colors',
                  isActive
                    ? 'bg-accent font-medium text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
