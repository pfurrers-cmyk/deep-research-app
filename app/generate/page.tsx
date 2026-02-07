'use client';

import { useState } from 'react';
import { ImageIcon, Loader2, Download, RotateCcw } from 'lucide-react';
import { getImageModels } from '@/config/models';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';

type ImageSize = '1024x1024' | '1792x1024' | '1024x1792';

export default function GeneratePage() {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('openai/gpt-image-1');
  const [size, setSize] = useState<ImageSize>('1024x1024');
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const imageModels = getImageModels();
  const modelOptions = imageModels.map((m) => ({
    value: m.id,
    label: `${m.name} (${m.provider})`,
  }));

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    setImageUrl(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), model, size }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setImageUrl(data.imageUrl || data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar imagem');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `generated-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <ImageIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Geração de Imagens</h1>
            <p className="text-sm text-muted-foreground">
              Gere imagens a partir de prompts usando modelos do AI Gateway
            </p>
          </div>
        </div>

        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle>Prompt</CardTitle>
            <CardDescription>
              Descreva a imagem que deseja gerar em detalhes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Um gato astronauta flutuando no espaço, estilo arte digital, cores vibrantes, alta qualidade..."
              rows={4}
              disabled={isGenerating}
              className="w-full resize-none rounded-lg border border-input bg-card p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Modelo</label>
                <Select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  options={modelOptions}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tamanho</label>
                <Select
                  value={size}
                  onChange={(e) => setSize(e.target.value as ImageSize)}
                  options={[
                    { value: '1024x1024', label: '1024×1024 (Quadrado)' },
                    { value: '1792x1024', label: '1792×1024 (Paisagem)' },
                    { value: '1024x1792', label: '1024×1792 (Retrato)' },
                  ]}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4" />
                    Gerar Imagem
                  </>
                )}
              </Button>
              {imageUrl && (
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                </Button>
              )}
              {(imageUrl || error) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setImageUrl(null);
                    setError(null);
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Result */}
        {imageUrl && (
          <Card>
            <CardContent className="p-2">
              <img
                src={imageUrl}
                alt={prompt}
                className="w-full rounded-lg"
              />
            </CardContent>
          </Card>
        )}

        {/* Info */}
        <p className="text-center text-xs text-muted-foreground">
          Funcionalidade secundária desvinculada da pesquisa profunda.
          A API de geração de imagem será implementada na próxima fase.
          {imageModels.length} modelos de imagem disponíveis.
        </p>
      </div>
    </div>
  );
}
