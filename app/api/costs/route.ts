// app/api/costs/route.ts — Custos acumulados (implementação Fase 2)

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      error: 'Not implemented',
      message: 'Cost tracker em desenvolvimento — Fase 2',
    },
    { status: 501 }
  );
}
