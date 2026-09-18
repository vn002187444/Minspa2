/**
 * Backfill services thiếu image_alt / image_url / description
 * Chạy 1 lần: npx tsx scripts/backfill-services.ts
 * Yêu cầu: SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL, GEMINI_API_KEY (optional)
 */
import 'dotenv/config'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'
import { generateServiceImageAlt, ensureGeoAlt } from '../lib/image-alt'
import { enrichServiceImage, enrichServiceDescription, isServiceDescriptionIncomplete, isServiceImageMissing } from '../lib/service-enricher'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
if (!url || !key) { console.error('Missing env'); process.exit(1) }
const supabase = createClient(url, key)

async function main() {
  const { data: services, error } = await supabase.from('services').select('id, name, category, price, duration, description, image_url, image_alt').limit(200)
  if (error) throw error
  let imgFixed = 0, altFixed = 0, descFixed = 0
  for (const s of services || []) {
    const updates: Record<string, string> = {}
    // image_alt
    if (!s.image_alt?.trim()) {
      updates.image_alt = generateServiceImageAlt(s.name, s.category)
      altFixed++
    } else {
      const fixed = ensureGeoAlt(s.image_alt, s.name).normalize('NFC')
      if (fixed !== s.image_alt) { updates.image_alt = fixed; altFixed++ }
    }
    // image_url missing
    if (isServiceImageMissing(s.image_url)) {
      const enriched = await enrichServiceImage(s.name, s.category)
      if (enriched) { updates.image_url = enriched.image_url; if (!updates.image_alt) updates.image_alt = enriched.image_alt; imgFixed++ }
    }
    // description missing/short
    if (isServiceDescriptionIncomplete(s.description)) {
      const d = await enrichServiceDescription(s.name, s.category, s.price, s.duration)
      if (d) { updates.description = d; descFixed++ }
    }
    if (Object.keys(updates).length) {
      const { error: upErr } = await supabase.from('services').update(updates).eq('id', s.id)
      if (upErr) console.error('Update failed', s.name, upErr.message)
      else console.log(`• ${s.name}:`, Object.keys(updates).join(', '))
    }
  }
  console.log(`Done: alt=${altFixed}, img=${imgFixed}, desc=${descFixed}`)
}
main().catch(e => { console.error(e); process.exit(1) })
