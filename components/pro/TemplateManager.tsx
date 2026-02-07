// components/pro/TemplateManager.tsx — Save/load research configuration templates
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Save, Trash2, Play, Star, StarOff, Search, Plus, X, BookTemplate } from 'lucide-react';
import { loadPreferences, savePreferences, type UserPreferences } from '@/lib/config/settings-store';
import { APP_CONFIG } from '@/config/defaults';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ============================================================
// TYPES
// ============================================================

export interface ResearchTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
  config: UserPreferences['pro'];
  depth?: string;
  domainPreset?: string | null;
}

const TEMPLATES_KEY = 'deep-research-templates';

// ============================================================
// PERSISTENCE
// ============================================================

function loadTemplates(): ResearchTemplate[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTemplatesStorage(templates: ResearchTemplate[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

// ============================================================
// COMPONENT
// ============================================================

interface TemplateManagerProps {
  onApplyTemplate?: (template: ResearchTemplate) => void;
}

export function TemplateManager({ onApplyTemplate }: TemplateManagerProps) {
  const [templates, setTemplates] = useState<ResearchTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Geral');

  useEffect(() => {
    setTemplates(loadTemplates());
  }, []);

  const saveTemplate = useCallback(() => {
    if (!newName.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    const prefs = loadPreferences();
    const template: ResearchTemplate = {
      id: `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: newName.trim(),
      description: newDesc.trim(),
      category: newCategory.trim() || 'Geral',
      favorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      config: { ...prefs.pro },
      depth: prefs.defaultDepth,
      domainPreset: null,
    };

    const updated = [...templates, template];
    setTemplates(updated);
    saveTemplatesStorage(updated);
    setShowSaveForm(false);
    setNewName('');
    setNewDesc('');
    toast.success(`Template "${template.name}" salvo`);
  }, [newName, newDesc, newCategory, templates]);

  const deleteTemplate = useCallback((id: string) => {
    const removed = templates.find((t) => t.id === id);
    const updated = templates.filter((t) => t.id !== id);
    setTemplates(updated);
    saveTemplatesStorage(updated);
    toast.success('Template removido', {
      action: removed ? {
        label: 'Desfazer',
        onClick: () => {
          const restored = [...updated, removed].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          setTemplates(restored);
          saveTemplatesStorage(restored);
        },
      } : undefined,
    });
  }, [templates]);

  const toggleFavorite = useCallback((id: string) => {
    const updated = templates.map((t) =>
      t.id === id ? { ...t, favorite: !t.favorite } : t
    );
    setTemplates(updated);
    saveTemplatesStorage(updated);
  }, [templates]);

  const applyTemplate = useCallback((template: ResearchTemplate) => {
    savePreferences({ pro: template.config });
    if (onApplyTemplate) onApplyTemplate(template);
    toast.success(`Template "${template.name}" aplicado`);
  }, [onApplyTemplate]);

  const filtered = templates
    .filter((t) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
    })
    .sort((a, b) => (a.favorite === b.favorite ? 0 : a.favorite ? -1 : 1));

  const categories = [...new Set(templates.map((t) => t.category))];
  const proConfig = APP_CONFIG.pro;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookTemplate className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-bold">Templates Salvos</h3>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{templates.length}</span>
        </div>
        <button
          onClick={() => setShowSaveForm(!showSaveForm)}
          className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
        >
          {showSaveForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showSaveForm ? 'Cancelar' : 'Salvar Atual'}
        </button>
      </div>

      {/* Save form */}
      {showSaveForm && (
        <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome do template"
            className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            autoFocus
          />
          <input
            type="text"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Descrição (opcional)"
            className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex gap-2">
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="flex-1 rounded-lg border border-input bg-card px-3 py-2 text-sm"
            >
              <option value="Geral">Geral</option>
              <option value="Acadêmico">Acadêmico</option>
              <option value="Profissional">Profissional</option>
              <option value="Pessoal">Pessoal</option>
              {categories.filter((c) => !['Geral', 'Acadêmico', 'Profissional', 'Pessoal'].includes(c)).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              onClick={saveTemplate}
              disabled={!newName.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              Salvar
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Salva: estilo ({proConfig.writingStyle.options[loadPreferences().pro.writingStyle]?.label}), detalhe, idioma, citação, framework, modo, seções, filtros
          </p>
        </div>
      )}

      {/* Search */}
      {templates.length > 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar templates..."
            className="w-full rounded-lg border border-input bg-card py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      )}

      {/* Template list */}
      {filtered.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">
          {templates.length === 0 ? 'Nenhum template salvo. Clique "Salvar Atual" para criar o primeiro.' : 'Nenhum resultado encontrado.'}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((template) => {
            const style = proConfig.writingStyle.options[template.config.writingStyle]?.label ?? template.config.writingStyle;
            const detail = proConfig.detailLevel.options[template.config.detailLevel]?.label ?? template.config.detailLevel;
            const mode = proConfig.researchMode.options[template.config.researchMode]?.label ?? template.config.researchMode;

            return (
              <div
                key={template.id}
                className="flex items-center gap-3 rounded-lg border border-border p-3 transition-all hover:border-primary/30 hover:bg-muted/10"
              >
                <button onClick={() => toggleFavorite(template.id)} className="shrink-0 text-muted-foreground hover:text-yellow-500">
                  {template.favorite ? <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" /> : <StarOff className="h-4 w-4" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold truncate">{template.name}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{template.category}</span>
                  </div>
                  {template.description && (
                    <p className="text-xs text-muted-foreground truncate">{template.description}</p>
                  )}
                  <div className="mt-1 flex flex-wrap gap-1">
                    <span className="rounded bg-muted/60 px-1.5 py-0.5 text-[9px] text-muted-foreground">{style}</span>
                    <span className="rounded bg-muted/60 px-1.5 py-0.5 text-[9px] text-muted-foreground">{detail}</span>
                    <span className="rounded bg-muted/60 px-1.5 py-0.5 text-[9px] text-muted-foreground">{mode}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => applyTemplate(template)}
                    className="rounded-lg bg-primary/10 p-2 text-primary hover:bg-primary/20"
                    title="Aplicar template"
                  >
                    <Play className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteTemplate(template.id)}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                    title="Remover template"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
