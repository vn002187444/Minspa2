import { NextRequest, NextResponse } from 'next/server'
import { runDanceSeo } from '@/lib/auto-seo-dance'
import { getSession } from '@/utils/auth'

async function isAuthorized(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('authorization') || ''
  if (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) return true
  if (req.headers.get('x-supabase-cron') === 'true') return true
  try { const session = await getSession(); if (session?.user?.role === 'ADMIN') return true } catch {}
  return false
}

async function handle(req: NextRequest) {
  if (!(await isAuthorized(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const isForce = new URL(req.url).searchParams.get('force') === '1'
  const result = await runDanceSeo({ force: isForce })
  return NextResponse.json({ success: result.success, message: result.message })
}

export async function GET(req: NextRequest) { return handle(req) }
export async function POST(req: NextRequest) { return handle(req) }
