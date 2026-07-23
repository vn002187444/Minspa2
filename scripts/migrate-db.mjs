import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const { Pool } = pg

async function run() {
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL_NON_POOLING,
    ssl: { rejectUnauthorized: false },
  })

  try {
    console.log('Adding mascot_image_urls column...')
    await pool.query(`
      ALTER TABLE seo_settings
      ADD COLUMN IF NOT EXISTS mascot_image_urls JSONB DEFAULT '[]'::jsonb;
    `)
    console.log('Column added!')

    const urls = JSON.parse(readFileSync(join(__dirname, 'mascot-urls.json'), 'utf-8'))
    console.log(`Storing ${urls.length} URLs...`)

    await pool.query(`
      INSERT INTO seo_settings (id, mascot_image_urls, mascot_enabled, mascot_character, mascot_sound, updated_at)
      VALUES (1, $1::jsonb, true, 'min', true, NOW())
      ON CONFLICT (id) DO UPDATE SET
        mascot_image_urls = EXCLUDED.mascot_image_urls,
        mascot_enabled = EXCLUDED.mascot_enabled,
        mascot_character = EXCLUDED.mascot_character,
        mascot_sound = EXCLUDED.mascot_sound,
        updated_at = EXCLUDED.updated_at;
    `, [JSON.stringify(urls)])
    console.log('URLs stored!')

    const { rows } = await pool.query(
      `SELECT mascot_image_urls, mascot_enabled FROM seo_settings WHERE id = 1`
    )
    const count = rows[0]?.mascot_image_urls?.length || 0
    console.log(`Verified: ${count} URLs stored`)
  } finally {
    await pool.end()
  }
}

run().catch(console.error)
