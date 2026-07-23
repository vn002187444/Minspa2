import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  // Read URLs file
  const urls = JSON.parse(readFileSync(join(__dirname, 'mascot-urls.json'), 'utf-8'))
  console.log(`Loaded ${urls.length} URLs`)

  console.log('Step 1: Try adding column via direct update...')
  const testResult = await supabase
    .from('seo_settings')
    .update({ mascot_image_urls: [] })
    .eq('id', 1)

  if (testResult.error) {
    console.log('Column missing or error:', testResult.error.message)
    console.log('Step 1b: Try SQL via REST API...')
    const sqlUrl = `${supabaseUrl}/rest/v1/rpc/exec_sql`
    const sqlResp = await fetch(sqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        sql: `ALTER TABLE seo_settings ADD COLUMN IF NOT EXISTS mascot_image_urls JSONB DEFAULT '[]'::jsonb;`
      })
    })
    if (!sqlResp.ok) {
      const errText = await sqlResp.text()
      console.log('SQL RPC failed:', errText)
    } else {
      console.log('Column added via RPC')
    }
  } else {
    console.log('Column exists')
  }

  console.log('Step 2: Storing URLs in seo_settings...')
  const { error: updateError } = await supabase
    .from('seo_settings')
    .upsert({
      id: 1,
      mascot_image_urls: urls,
      mascot_enabled: true,
      mascot_character: 'min',
      mascot_sound: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })

  if (updateError) {
    console.error('Update failed:', updateError.message)
    process.exit(1)
  }

  console.log('URLs stored successfully! Count:', urls.length)

  // Verify
  const { data, error } = await supabase
    .from('seo_settings')
    .select('mascot_image_urls, mascot_enabled')
    .eq('id', 1)
    .single()

  if (error) {
    console.error('Verify failed:', error.message)
  } else {
    const count = data.mascot_image_urls?.length || 0
    console.log(`Verified: ${count} URLs stored, mascot_enabled: ${data.mascot_enabled}`)
  }
}

run().catch(console.error)
