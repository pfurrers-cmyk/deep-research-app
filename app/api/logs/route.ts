// app/api/logs/route.ts — Expõe logs do servidor para o cliente
import { getServerLogs, exportDebugLogs } from '@/lib/utils/debug-logger';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format');

  const logs = getServerLogs();

  if (format === 'text') {
    const text = exportDebugLogs(logs);
    return new Response(text, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  return Response.json({ logs, count: logs.length });
}
