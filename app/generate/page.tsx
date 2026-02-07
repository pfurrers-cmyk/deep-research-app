'use client';

import { useState } from 'react';
import { ImageIcon, Loader2, Download, RotateCcw, Video } from 'lucide-react';
import { getImageModels, getVideoModels } from '@/config/models';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';

type GenerateMode = 'image' | 'video';
type ImageSize = '1024x1024' | '1792x1024' | '1024x1792';

export default function GeneratePage() {
  const [mode, setMode] = useState<GenerateMode>('image');
  const [prompt, setPrompt] = useState('');
  const [imageModel, setImageModel] = useState('bfl/flux-pro-1.1');
  const [videoModel, setVideoModel] = useState('google/veo-3.1-generate-001');
  const [size, setSize] = useState<ImageSize>('1024x1024');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultType, setResultType] = useState<'image' | 'video' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const imageModels = getImageModels();
  const videoModels = getVideoModels();

  const imageModelOptions = imageModels.map((m) => ({
    value: m.id,
    label: `${m.name} (${m.provider})`,
  }));
  const videoModelOptions = videoModels.map((m) => ({
    value: m.id,
    label: `${m.name} (${m.provider})`,
  }));

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    setResultUrl(null);
    setResultType(null);

    try {
      const selectedModel = mode === 'image' ? imageModel : videoModel;
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model: selectedModel,
          size: mode === 'image' ? size : undefined,
          mode,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.type === 'video') {
        setResultUrl(data.videoUrl);
        setResultType('video');
      } else {
        setResultUrl(data.imageUrl);
        setResultType('image');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `generated-${Date.now()}.${resultType === 'video' ? 'mp4' : 'png'}`;
    a.click();
  };

  const handleReset = () => {
    setResultUrl(null);
    setResultType(null);
    setError(null);
  };

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            {mode === 'image' ? (
              <ImageIcon className="h-6 w-6 text-primary" />
            ) : (
              <Video className="h-6 w-6 text-primary" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">Geração de Imagens & Vídeos</h1>
            <p className="text-sm text-muted-foreground">
              Gere conteúdo visual a partir de prompts via AI Gateway
            </p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex rounded-lg border border-input p-1">
          <button
            onClick={() => setMode('image')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'image'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            Imagem ({imageModels.length} modelos)
          </button>
          <button
            onClick={() => setMode('video')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'video'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Video className="h-4 w-4" />
            Vídeo ({videoModels.length} modelos)
          </button>
        </div>

        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle>Prompt</CardTitle>
            <CardDescription>
              {mode === 'image'
                ? 'Descreva a imagem que deseja gerar em detalhes'
                : 'Descreva o vídeo que deseja gerar (experimental)'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                mode === 'image'
                  ? 'Ex: Um gato astronauta flutuando no espaço, estilo arte digital, cores vibrantes...'
                  : 'Ex: Um drone sobrevoando uma floresta tropical ao pôr do sol, câmera lenta, 4K...'
              }
              rows={4}
              disabled={isGenerating}
              className="w-full resize-none rounded-lg border border-input bg-card p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Modelo</label>
                {mode === 'image' ? (
                  <Select
                    value={imageModel}
                    onChange={(e) => setImageModel(e.target.value)}
                    options={imageModelOptions}
                  />
                ) : (
                  <Select
                    value={videoModel}
                    onChange={(e) => setVideoModel(e.target.value)}
                    options={videoModelOptions}
                  />
                )}
              </div>
              {mode === 'image' && (
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
              )}
              {mode === 'video' && (
                <div className="flex items-end">
                  <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                    ⚡ Experimental — Veo 3.1 via AI Gateway
                  </p>
                </div>
              )}
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
                    Gerando {mode === 'image' ? 'imagem' : 'vídeo'}...
                  </>
                ) : (
                  <>
                    {mode === 'image' ? (
                      <ImageIcon className="h-4 w-4" />
                    ) : (
                      <Video className="h-4 w-4" />
                    )}
                    Gerar {mode === 'image' ? 'Imagem' : 'Vídeo'}
                  </>
                )}
              </Button>
              {resultUrl && (
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                </Button>
              )}
              {(resultUrl || error) && (
                <Button variant="outline" onClick={handleReset}>
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

        {/* Result — Image */}
        {resultUrl && resultType === 'image' && (
          <Card>
            <CardContent className="p-2">
              <img
                src={resultUrl}
                alt={prompt}
                className="w-full rounded-lg"
              />
            </CardContent>
          </Card>
        )}

        {/* Result — Video */}
        {resultUrl && resultType === 'video' && (
          <Card>
            <CardContent className="p-2">
              <video
                src={resultUrl}
                controls
                autoPlay
                loop
                className="w-full rounded-lg"
              />
            </CardContent>
          </Card>
        )}

        {/* Info */}
        <p className="text-center text-xs text-muted-foreground">
          {imageModels.length} modelos de imagem · {videoModels.length} modelo(s) de vídeo ·
          Geração via Vercel AI Gateway
        </p>
      </div>
    </div>
  );
}
