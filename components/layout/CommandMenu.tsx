'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Search,
  ImageIcon,
  Swords,
  BookOpen,
  Settings,
  RotateCcw,
} from 'lucide-react';
import { db } from '@/lib/db';

interface RecentSearch {
  id: string;
  query: string;
}

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (open) {
      db.researches
        .orderBy('createdAt')
        .reverse()
        .limit(5)
        .toArray()
        .then((items) =>
          setRecentSearches(items.map((i) => ({ id: i.id, query: i.query })))
        )
        .catch(() => setRecentSearches([]));
    }
  }, [open]);

  const navigate = useCallback(
    (path: string) => {
      setOpen(false);
      router.push(path);
    },
    [router]
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command Palette"
      description="Buscar páginas, pesquisas, ações..."
    >
      <CommandInput placeholder="Buscar páginas, pesquisas, ações..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

        <CommandGroup heading="Navegação">
          <CommandItem onSelect={() => navigate('/')}>
            <Search className="mr-2 h-4 w-4" />
            <span>Nova Pesquisa</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate('/generate')}>
            <ImageIcon className="mr-2 h-4 w-4" />
            <span>Gerar Imagem</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate('/arena')}>
            <Swords className="mr-2 h-4 w-4" />
            <span>Arena de IAs</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate('/library')}>
            <BookOpen className="mr-2 h-4 w-4" />
            <span>Biblioteca</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate('/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Configurações</span>
          </CommandItem>
        </CommandGroup>

        {recentSearches.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Pesquisas Recentes">
              {recentSearches.map((s) => (
                <CommandItem
                  key={s.id}
                  onSelect={() => navigate(`/research/${s.id}`)}
                >
                  <RotateCcw className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{s.query}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
