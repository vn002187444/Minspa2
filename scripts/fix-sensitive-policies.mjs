import fs from 'fs';
import pg from 'pg';
const env = fs.readFileSync('.env.local', 'utf8');
const connStr = env.match(/POSTGRES_URL=(.+)/)?.[1]?.trim();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const c = new pg.Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
await c.connect();
console.log('Fixing sensitive table policies: restricting to service_role only...');
// Drop the over-permissive "Service role all ..." with roles {public} and recreate with service_role
for (const tbl of ['users', 'customers', 'appointments', 'rate_limits']) {
  await c.query(`DROP POLICY IF EXISTS "Service role all ${tbl}" ON ${tbl}`);
  console.log(`Dropped "Service role all ${tbl}"`);
  await c.query(`CREATE POLICY "Service role all ${tbl}" ON ${tbl} FOR ALL TO service_role USING (true) WITH CHECK (true)`);
  console.log(`Created "Service role all ${tbl}" for service_role only`);
}
// Fix notifications service_role policies that are also public
for (const pol of ['Service role all notifications', 'Service role can insert notifications', 'Service role can update notifications']) {
  const tbl = 'notifications';
  await c.query(`DROP POLICY IF EXISTS "${pol}" ON ${tbl}`);
  console.log(`Dropped "${pol}"`);
}
await c.query(`CREATE POLICY "Service role all notifications" ON notifications FOR ALL TO service_role USING (true) WITH CHECK (true)`);
console.log('Created "Service role all notifications" for service_role only');
// Verify
const r = await c.query("SELECT tablename, policyname, roles FROM pg_policies WHERE tablename IN ('users','customers','appointments','rate_limits','notifications') AND policyname LIKE 'Service role%' ORDER BY tablename");
console.log('New service_role policies:', r.rows);
await c.end();
console.log('Done');
