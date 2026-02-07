// components/pro/ProConfigPanel.tsx — Prompt Reverso PRO configuration panel
'use client';

import { useState, useCallback } from 'react';
import {
  Pen, BarChart3, Globe, Quote, Shield, Compass, LayoutList,
  Filter, FileOutput, ChevronDown, ChevronUp, Info, GripVertical,
  Lock, X, Plus,
} from 'lucide-react';
import { APP_CONFIG } from '@/config/defaults';
import { loadPreferences, savePreferences, type UserPreferences } from '@/lib/config/settings-store';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

// ============================================================
// TYPES
// ============================================================

type ProSettings = UserPreferences['pro'];

interface ProConfigPanelProps {
  onClose?: () => void;
  compact?: boolean;
}

// ============================================================
// COMPONENT
// ============================================================

export function ProConfigPanel({ onClose, compact = false }: ProConfigPanelProps) {
  const [settings, setSettings] = useState<ProSettings>(() => loadPreferences().pro);
  const [expandedSection, setExpandedSection] = useState<string | null>(compact ? null : 'writingStyle');
  const [showPreview, setShowPreview] = useState<string | null>(null);

  const pro = APP_CONFIG.pro;

  const updateSettings = useCallback((patch: Partial<ProSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      savePreferences({ pro: next });
      return next;
    });
  }, []);

  const updateFilters = useCallback((patch: Partial<ProSettings['advancedFilters']>) => {
    setSettings((prev) => {
      const next = {
        ...prev,
        advancedFilters: { ...prev.advancedFilters, ...patch },
      };
      savePreferences({ pro: next });
      return next;
    });
  }, []);

  const toggleSection = (id: string) => {
    setExpandedSection((prev) => (prev === id ? null : id));
  };

  // ============================================================
  // SECTION: Writing Style
  // ============================================================
  const renderWritingStyle = () => {
    const opts = pro.writingStyle.options;
    return (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(opts).map(([key, opt]) => (
          <button
            key={key}
            onClick={() => updateSettings({ writingStyle: key })}
            onMouseEnter={() => setShowPreview(key)}
            onMouseLeave={() => setShowPreview(null)}
            className={cn(
              'relative flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all',
              settings.writingStyle === key
                ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                : 'border-border hover:border-primary/40 hover:bg-muted/30'
            )}
            aria-pressed={settings.writingStyle === key}
            aria-describedby={`ws-desc-${key}`}
          >
            <span className="text-sm font-semibold">{opt.label}</span>
            <span id={`ws-desc-${key}`} className="text-xs text-muted-foreground">{opt.description}</span>
            {showPreview === key && (
              <div className="mt-2 rounded border border-border/50 bg-muted/50 p-2 text-[11px] italic text-muted-foreground leading-relaxed">
                {opt.preview}
              </div>
            )}
          </button>
        ))}
      </div>
    );
  };

  // ============================================================
  // SECTION: Detail Level
  // ============================================================
  const renderDetailLevel = () => {
    const opts = pro.detailLevel.options;
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Object.entries(opts).map(([key, opt]) => (
          <button
            key={key}
            onClick={() => updateSettings({ detailLevel: key })}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all',
              settings.detailLevel === key
                ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                : 'border-border hover:border-primary/40'
            )}
            aria-pressed={settings.detailLevel === key}
          >
            <span className="text-sm font-bold">{opt.label}</span>
            <span className="text-xs text-muted-foreground">{opt.pages}</span>
            <span className="text-[10px] text-muted-foreground/70">{opt.readTime}</span>
            <span className="mt-1 text-[10px] text-muted-foreground/60 text-center leading-tight">{opt.description}</span>
          </button>
        ))}
      </div>
    );
  };

  // ============================================================
  // SECTION: Reasoning Language
  // ============================================================
  const renderReasoningLanguage = () => {
    const opts = pro.reasoningLanguage.options;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5" />
          <span>Controla o idioma que a IA usa ao &quot;pensar&quot; — a saída permanece no idioma configurado.</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(opts).map(([key, opt]) => (
            <button
              key={key}
              onClick={() => updateSettings({ reasoningLanguage: key })}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-medium transition-all',
                settings.reasoningLanguage === key
                  ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary/30'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
              )}
              aria-pressed={settings.reasoningLanguage === key}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {settings.reasoningLanguage === 'auto' && (
          <p className="text-xs text-primary/70">Auto (usando {settings.reasoningLanguage === 'auto' ? 'English para análise, Português para saída' : ''})</p>
        )}
      </div>
    );
  };

  // ============================================================
  // SECTION: Citation Format
  // ============================================================
  const renderCitationFormat = () => {
    const opts = pro.citationFormat.options;
    return (
      <div className="space-y-2">
        {Object.entries(opts).map(([key, opt]) => (
          <label
            key={key}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all',
              settings.citationFormat === key
                ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                : 'border-border hover:border-primary/40'
            )}
          >
            <input
              type="radio"
              name="citationFormat"
              value={key}
              checked={settings.citationFormat === key}
              onChange={() => updateSettings({ citationFormat: key })}
              className="mt-1 accent-primary"
            />
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{opt.label}</span>
                <span className="text-[10px] text-muted-foreground">{opt.bestFor}</span>
              </div>
              <p className="text-xs text-muted-foreground">{opt.description}</p>
              <p className="rounded bg-muted/50 px-2 py-1 text-[11px] italic text-muted-foreground/80">{opt.example}</p>
            </div>
          </label>
        ))}
      </div>
    );
  };

  // ============================================================
  // SECTION: Evaluation Framework
  // ============================================================
  const renderEvaluationFramework = () => {
    const opts = pro.evaluationFramework.options;
    return (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {Object.entries(opts).map(([key, opt]) => (
          <button
            key={key}
            onClick={() => updateSettings({ evaluationFramework: key })}
            className={cn(
              'flex flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-all',
              settings.evaluationFramework === key
                ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                : 'border-border hover:border-primary/40'
            )}
            aria-pressed={settings.evaluationFramework === key}
          >
            <div className="flex w-full items-center justify-between">
              <span className="text-sm font-bold">{opt.label}</span>
              <span className="text-[10px] text-muted-foreground">{opt.bestFor}</span>
            </div>
            <span className="text-xs text-muted-foreground">{opt.description}</span>
            {opt.dimensions.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {opt.dimensions.map((d) => (
                  <span key={d} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{d}</span>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>
    );
  };

  // ============================================================
  // SECTION: Research Mode
  // ============================================================
  const renderResearchMode = () => {
    const opts = pro.researchMode.options;
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Object.entries(opts).map(([key, opt]) => (
          <button
            key={key}
            onClick={() => updateSettings({ researchMode: key })}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all',
              settings.researchMode === key
                ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                : 'border-border hover:border-primary/40'
            )}
            aria-pressed={settings.researchMode === key}
          >
            <span className="text-2xl">{opt.icon}</span>
            <span className="text-sm font-semibold">{opt.label}</span>
            <span className="text-center text-[10px] text-muted-foreground leading-tight">{opt.description}</span>
          </button>
        ))}
      </div>
    );
  };

  // ============================================================
  // SECTION: Report Sections (drag + toggle)
  // ============================================================
  const renderReportSections = () => {
    const available = pro.reportSections.available;
    const ordered = settings.sectionOrder
      .map((id) => available.find((s) => s.id === id))
      .filter(Boolean) as typeof available;
    // Add any missing sections at the end
    available.forEach((s) => {
      if (!ordered.find((o) => o.id === s.id)) ordered.push(s);
    });

    const moveSection = (idx: number, dir: -1 | 1) => {
      const newOrder = [...settings.sectionOrder];
      const target = idx + dir;
      if (target < 0 || target >= newOrder.length) return;
      [newOrder[idx], newOrder[target]] = [newOrder[target], newOrder[idx]];
      updateSettings({ sectionOrder: newOrder });
    };

    const toggleSectionEnabled = (id: string) => {
      const section = available.find((s) => s.id === id);
      if (section?.required) return;
      const enabled = settings.enabledSections.includes(id)
        ? settings.enabledSections.filter((s) => s !== id)
        : [...settings.enabledSections, id];
      updateSettings({ enabledSections: enabled });
    };

    return (
      <div className="space-y-1">
        {ordered.map((section, idx) => (
          <div
            key={section.id}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-2 transition-all',
              settings.enabledSections.includes(section.id)
                ? 'border-border bg-card'
                : 'border-border/50 bg-muted/20 opacity-60'
            )}
          >
            <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40 cursor-grab" />
            <div className="flex items-center gap-1">
              <button
                onClick={() => moveSection(idx, -1)}
                disabled={idx === 0}
                className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
                aria-label={`Mover ${section.label} para cima`}
              >
                <ChevronUp className="h-3 w-3" />
              </button>
              <button
                onClick={() => moveSection(idx, 1)}
                disabled={idx === ordered.length - 1}
                className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
                aria-label={`Mover ${section.label} para baixo`}
              >
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>
            <span className="flex-1 text-sm">{section.label}</span>
            {section.required ? (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Lock className="h-3 w-3" /> Obrigatório
              </div>
            ) : (
              <Switch
                checked={settings.enabledSections.includes(section.id)}
                onCheckedChange={() => toggleSectionEnabled(section.id)}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  // ============================================================
  // SECTION: Advanced Filters
  // ============================================================
  const renderAdvancedFilters = () => {
    const { advancedFilters: af } = pro;
    const filters = settings.advancedFilters;
    const [newDomain, setNewDomain] = useState('');

    const addDomain = (list: 'allowlist' | 'blocklist') => {
      const domain = newDomain.trim().toLowerCase();
      if (!domain) return;
      const current = filters[list];
      if (!current.includes(domain)) {
        updateFilters({ [list]: [...current, domain] });
      }
      setNewDomain('');
    };

    const removeDomain = (list: 'allowlist' | 'blocklist', domain: string) => {
      updateFilters({ [list]: filters[list].filter((d) => d !== domain) });
    };

    return (
      <div className="space-y-4">
        {/* Recency */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Recência</p>
          <div className="flex flex-wrap gap-2">
            {af.recency.options.map((opt) => (
              <button
                key={String(opt.value)}
                onClick={() => updateFilters({ recency: opt.value })}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs transition-all',
                  filters.recency === opt.value
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border text-muted-foreground hover:border-primary/40'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Source Types */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Tipos de Fonte</p>
          <div className="flex flex-wrap gap-2">
            {af.sourceTypes.map((type) => {
              const active = filters.sourceTypes.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => {
                    const next = active
                      ? filters.sourceTypes.filter((t) => t !== type)
                      : [...filters.sourceTypes, type];
                    updateFilters({ sourceTypes: next });
                  }}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs capitalize transition-all',
                    active
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border text-muted-foreground hover:border-primary/40'
                  )}
                >
                  {active && '✓ '}{type}
                </button>
              );
            })}
          </div>
        </div>

        {/* Languages */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Idiomas das Fontes</p>
          <div className="flex flex-wrap gap-2">
            {af.languages.map((lang) => {
              const active = filters.languages.includes(lang.code);
              return (
                <button
                  key={lang.code}
                  onClick={() => {
                    const next = active
                      ? filters.languages.filter((l) => l !== lang.code)
                      : [...filters.languages, lang.code];
                    updateFilters({ languages: next });
                  }}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs transition-all',
                    active
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border text-muted-foreground hover:border-primary/40'
                  )}
                >
                  {lang.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Allowlist / Blocklist */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Domínios (Allowlist / Blocklist)</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="ex: arxiv.org"
              className="flex-1 rounded-lg border border-input bg-card px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); addDomain('allowlist'); }
              }}
            />
            <button onClick={() => addDomain('allowlist')} className="rounded-lg border border-green-500/30 bg-green-500/10 px-2 py-1 text-xs text-green-500 hover:bg-green-500/20">
              <Plus className="inline h-3 w-3" /> Allow
            </button>
            <button onClick={() => addDomain('blocklist')} className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs text-red-500 hover:bg-red-500/20">
              <Plus className="inline h-3 w-3" /> Block
            </button>
          </div>
          {filters.allowlist.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <span className="text-[10px] text-green-500 font-medium mr-1">Allow:</span>
              {filters.allowlist.map((d) => (
                <span key={d} className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] text-green-500">
                  {d}
                  <button onClick={() => removeDomain('allowlist', d)}><X className="h-2.5 w-2.5" /></button>
                </span>
              ))}
            </div>
          )}
          {filters.blocklist.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <span className="text-[10px] text-red-500 font-medium mr-1">Block:</span>
              {filters.blocklist.map((d) => (
                <span key={d} className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] text-red-500">
                  {d}
                  <button onClick={() => removeDomain('blocklist', d)}><X className="h-2.5 w-2.5" /></button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============================================================
  // SECTION: Export Formats
  // ============================================================
  const renderExportFormats = () => {
    const opts = pro.exportFormats.options;
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Object.entries(opts).map(([key, opt]) => (
          <button
            key={key}
            onClick={() => updateSettings({ exportFormat: key })}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all',
              settings.exportFormat === key
                ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                : 'border-border hover:border-primary/40'
            )}
            aria-pressed={settings.exportFormat === key}
          >
            <span className="text-2xl">{opt.icon}</span>
            <span className="text-sm font-semibold">{opt.label}</span>
            <span className="text-center text-[10px] text-muted-foreground">{opt.description}</span>
          </button>
        ))}
      </div>
    );
  };

  // ============================================================
  // SECTION DEFINITIONS
  // ============================================================
  const sections = [
    { id: 'writingStyle', label: 'Estilo de Escrita', icon: Pen, render: renderWritingStyle, badge: pro.writingStyle.options[settings.writingStyle]?.label },
    { id: 'detailLevel', label: 'Nível de Detalhe', icon: BarChart3, render: renderDetailLevel, badge: pro.detailLevel.options[settings.detailLevel]?.label },
    { id: 'reasoningLanguage', label: 'Idioma de Análise', icon: Globe, render: renderReasoningLanguage, badge: pro.reasoningLanguage.options[settings.reasoningLanguage]?.label },
    { id: 'citationFormat', label: 'Formato de Citação', icon: Quote, render: renderCitationFormat, badge: pro.citationFormat.options[settings.citationFormat]?.label },
    { id: 'evaluationFramework', label: 'Framework de Avaliação', icon: Shield, render: renderEvaluationFramework, badge: pro.evaluationFramework.options[settings.evaluationFramework]?.label },
    { id: 'researchMode', label: 'Modo de Pesquisa', icon: Compass, render: renderResearchMode, badge: pro.researchMode.options[settings.researchMode]?.label },
    { id: 'reportSections', label: 'Seções do Relatório', icon: LayoutList, render: renderReportSections, badge: `${settings.enabledSections.length} ativas` },
    { id: 'advancedFilters', label: 'Filtros Avançados', icon: Filter, render: renderAdvancedFilters, badge: getFilterBadge(settings.advancedFilters) },
    { id: 'exportFormats', label: 'Formato de Saída', icon: FileOutput, render: renderExportFormats, badge: pro.exportFormats.options[settings.exportFormat]?.label },
  ];

  return (
    <div className="space-y-1" data-select-scope="pro-config">
      {sections.map((section) => {
        const Icon = section.icon;
        const isOpen = expandedSection === section.id;
        return (
          <div key={section.id} className="rounded-lg border border-border/50 overflow-hidden">
            <button
              onClick={() => toggleSection(section.id)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/30"
              aria-expanded={isOpen}
            >
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 text-sm font-medium">{section.label}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{section.badge}</span>
              {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {isOpen && (
              <div className="border-t border-border/30 bg-muted/10 px-4 py-3">
                {section.render()}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function getFilterBadge(filters: ProSettings['advancedFilters']): string {
  const parts: string[] = [];
  if (filters.recency) parts.push(filters.recency);
  if (filters.sourceTypes.length > 0) parts.push(`${filters.sourceTypes.length} tipos`);
  if (filters.allowlist.length > 0) parts.push(`${filters.allowlist.length} allow`);
  if (filters.blocklist.length > 0) parts.push(`${filters.blocklist.length} block`);
  return parts.length > 0 ? parts.join(', ') : 'Nenhum';
}
