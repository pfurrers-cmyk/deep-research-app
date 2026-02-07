// lib/utils/streaming.ts — Helpers para SSE (Server-Sent Events) streaming
import type { PipelineEvent } from '@/lib/research/types';

const encoder = new TextEncoder();

export function encodeSSE(event: PipelineEvent | Record<string, unknown>): Uint8Array {
  const data = JSON.stringify(event);
  return encoder.encode(`data: ${data}\n\n`);
}

export function encodeSSEDone(): Uint8Array {
  return encoder.encode('data: [DONE]\n\n');
}

export interface SSEWriter {
  writeEvent(event: PipelineEvent): void;
  close(): void;
}

export interface GenericSSEWriter {
  writeEvent(event: Record<string, unknown>): void;
  close(): void;
}

export function createSSEStream(): {
  stream: ReadableStream;
  writer: SSEWriter;
} {
  let controller: ReadableStreamDefaultController | null = null;

  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
    cancel() {
      controller = null;
    },
  });

  const writer: SSEWriter = {
    writeEvent(event: PipelineEvent) {
      if (!controller) return;
      try {
        controller.enqueue(encodeSSE(event));
      } catch {
        // Stream already closed
      }
    },
    close() {
      if (!controller) return;
      try {
        controller.enqueue(encodeSSEDone());
        controller.close();
      } catch {
        // Stream already closed
      }
      controller = null;
    },
  };

  return { stream, writer };
}

export function createGenericSSEStream(): {
  stream: ReadableStream;
  writer: GenericSSEWriter;
} {
  let controller: ReadableStreamDefaultController | null = null;

  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
    cancel() {
      controller = null;
    },
  });

  const writer: GenericSSEWriter = {
    writeEvent(event: Record<string, unknown>) {
      if (!controller) return;
      try {
        controller.enqueue(encodeSSE(event));
      } catch {
        // Stream already closed
      }
    },
    close() {
      if (!controller) return;
      try {
        controller.enqueue(encodeSSEDone());
        controller.close();
      } catch {
        // Stream already closed
      }
      controller = null;
    },
  };

  return { stream, writer };
}

export function createSSEResponse(stream: ReadableStream): Response {
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
