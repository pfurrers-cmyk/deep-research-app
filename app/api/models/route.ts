// app/api/models/route.ts — Catálogo de modelos disponíveis no AI Gateway

import { NextResponse } from 'next/server';
import {
  MODELS,
  getModelsByTier,
  getAllProviders,
  getAllTiers,
} from '@/config/models';

export async function GET() {
  return NextResponse.json({
    models: MODELS,
    tiers: Object.fromEntries(
      getAllTiers().map((tier) => [tier, getModelsByTier(tier)])
    ),
    providers: getAllProviders(),
    total: MODELS.length,
  });
}
