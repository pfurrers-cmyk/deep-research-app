/**
 * MCP Streamable HTTP endpoint for Âmago.AI
 *
 * Stateless mode — each request creates a fresh server instance.
 * Compatible with Vercel serverless and Claude.ai custom connectors.
 *
 * URL: https://deep-research-app-mauve.vercel.app/api/mcp
 */

import { createAmagoMcpServer } from '@/lib/mcp/amago-mcp-server';

export const maxDuration = 60;

async function handleMcpRequest(req: Request): Promise<Response> {
  try {
    // Dynamically import to avoid bundling issues with Node.js modules
    const { WebStandardStreamableHTTPServerTransport } = await import(
      '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
    );

    const server = createAmagoMcpServer();
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless
      enableJsonResponse: true, // JSON responses instead of SSE (better for serverless)
    });

    await server.connect(transport);
    const response = await transport.handleRequest(req);
    return response;
  } catch (error) {
    console.error('[MCP] Error handling request:', error);
    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Internal server error',
        },
        id: null,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, MCP-Session-Id, MCP-Protocol-Version',
        },
      },
    );
  }
}

export async function POST(req: Request) {
  return handleMcpRequest(req);
}

export async function GET(req: Request) {
  return handleMcpRequest(req);
}

export async function DELETE(req: Request) {
  return handleMcpRequest(req);
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, MCP-Session-Id, MCP-Protocol-Version, Last-Event-ID',
    },
  });
}
