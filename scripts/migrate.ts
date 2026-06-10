// scripts/migrate.ts
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: true });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to convert arbitrary string IDs to UUIDs to satisfy Postgres UUID type
function toUUID(id: string | null | undefined): string | null {
  if (!id) return null;
  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)) {
    return id;
  }
  const hash = crypto.createHash('md5').update(id).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

async function migrate() {
  console.log('Starting DB migration from data/demo_db.json to Supabase...');
  const dbFile = path.join(process.cwd(), 'data', 'demo_db.json');
  if (!fs.existsSync(dbFile)) {
    console.warn('File data/demo_db.json not found. No data to migrate.');
    return; // Nothing to migrate, exit gracefully
  }

  const raw = fs.readFileSync(dbFile, 'utf8');
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse demo_db.json:', e);
    process.exit(1);
  }

  // 1. Migrate Users
  if (data.users?.length) {
    console.log(`Migrating ${data.users.length} users...`);
    const usersToInsert = data.users.map((u: any) => ({
      ...u,
      id: toUUID(u.id)
    }));
    const { error } = await supabase.from('users').upsert(usersToInsert);
    if (error) console.error('Error inserting users:', error);
    else console.log('Users migrated successfully.');
  }

  // 2. Migrate Services
  if (data.services?.length) {
    console.log(`Migrating ${data.services.length} services...`);
    const servicesToInsert = data.services.map((s: any) => ({
      ...s,
      id: toUUID(s.id)
    }));
    const { error } = await supabase.from('services').upsert(servicesToInsert);
    if (error) console.error('Error inserting services:', error);
    else console.log('Services migrated successfully.');
  }

  // 3. Migrate Customers
  if (data.customers?.length) {
    console.log(`Migrating ${data.customers.length} customers...`);
    const customersToInsert = data.customers.map((c: any) => ({
      ...c,
      id: toUUID(c.id)
    }));
    const { error } = await supabase.from('customers').upsert(customersToInsert);
    if (error) console.error('Error inserting customers:', error);
    else console.log('Customers migrated successfully.');
  }

  // 4. Migrate Appointments
  if (data.appointments?.length) {
    console.log(`Migrating ${data.appointments.length} appointments...`);
    const appointmentsToInsert = data.appointments.map((a: any) => {
      const { is_package_session, use_package_id, buy_package_id, ...rest } = a;
      return {
        ...rest,
        is_package_session: !!is_package_session,
        use_package_id: use_package_id ? toUUID(use_package_id) : null,
        buy_package_id: buy_package_id ? toUUID(buy_package_id) : null,
        id: toUUID(a.id),
        customer_id: toUUID(a.customer_id),
        staff_id: toUUID(a.staff_id)
      };
    });
    const { error } = await supabase.from('appointments').upsert(appointmentsToInsert);
    if (error) console.error('Error inserting appointments:', error);
    else console.log('Appointments migrated successfully.');
  }

  // 5. Migrate Appointment Services
  if (data.appointment_services?.length) {
    console.log(`Migrating ${data.appointment_services.length} appointment services...`);
    const apptServicesToInsert = data.appointment_services.map((as: any) => {
      const { created_at, id, ...rest } = as; // created_at is optional, ignore if present
      return {
        ...rest,
        appointment_id: toUUID(as.appointment_id),
        service_id: toUUID(as.service_id)
      };
    });
    const { error } = await supabase.from('appointment_services').upsert(apptServicesToInsert);
    if (error) console.error('Error inserting appointment services:', error);
    else console.log('Appointment services migrated successfully.');
  }

  // 6. Migrate Blogs
  if (data.blogs?.length) {
    console.log(`Migrating ${data.blogs.length} blogs...`);
    const postsToInsert = data.blogs.map((post: any) => ({
      ...post,
      id: toUUID(post.id)
    }));
    const { error } = await supabase.from('blogs').upsert(postsToInsert);
    if (error) console.error('Error inserting blogs:', error);
    else console.log('Blogs migrated successfully.');
  }

  // 7. Migrate Treatment Packages
  if (data.treatment_packages?.length) {
    console.log(`Migrating ${data.treatment_packages.length} treatment packages...`);
    const pkgsToInsert = data.treatment_packages.map((pkg: any) => ({
      ...pkg,
      id: toUUID(pkg.id),
      service_id: toUUID(pkg.service_id)
    }));
    const { error } = await supabase.from('treatment_packages').upsert(pkgsToInsert);
    if (error) console.error('Error inserting treatment packages:', error);
    else console.log('Treatment packages migrated successfully.');
  }

  // 8. Migrate Customer Packages
  if (data.customer_packages?.length) {
    console.log(`Migrating ${data.customer_packages.length} customer packages...`);
    const cpToInsert = data.customer_packages.map((cp: any) => ({
      ...cp,
      id: toUUID(cp.id),
      customer_id: toUUID(cp.customer_id),
      package_id: toUUID(cp.treatment_package_id), // map old field to new
      total_sessions: cp.total_sessions ?? null,
      status: cp.status ?? 'ACTIVE',
      purchased_at: cp.purchased_at ?? null,
      sold_by_staff_id: cp.sold_by_staff_id ? toUUID(cp.sold_by_staff_id) : null,
      commission_amount: cp.commission_amount ?? 0
    }));
    const { error } = await supabase.from('customer_packages').upsert(cpToInsert);
    if (error) console.error('Error inserting customer packages:', error);
    else console.log('Customer packages migrated successfully.');
  }

  // 9. Migrate Package Usage Logs
  if (data.package_usage_logs?.length) {
    console.log(`Migrating ${data.package_usage_logs.length} package usage logs...`);
    const logsToInsert = data.package_usage_logs.map((log: any) => ({
      ...log,
      id: toUUID(log.id),
      customer_package_id: toUUID(log.customer_package_id),
      appointment_id: toUUID(log.appointment_id)
    }));
    const { error } = await supabase.from('package_usage_logs').upsert(logsToInsert);
    if (error) console.error('Error inserting package logs:', error);
    else console.log('Package usage logs migrated successfully.');
  }

  // 10. Migrate Reviews
  if (data.reviews?.length) {
    console.log(`Migrating ${data.reviews.length} reviews...`);
    const reviewsToInsert = data.reviews.map((r: any) => ({
      ...r,
      id: toUUID(r.id),
      appointment_id: toUUID(r.appointment_id)
    }));
    const { error } = await supabase.from('reviews').upsert(reviewsToInsert);
    if (error) console.error('Error inserting reviews:', error);
    else console.log('Reviews migrated successfully.');
  }

  // 11. Migrate Attendance
  if (data.attendance?.length) {
    console.log(`Migrating ${data.attendance.length} attendance records...`);
    const attendanceToInsert = data.attendance.map((a: any) => ({
      ...a,
      id: toUUID(a.id),
      staff_id: toUUID(a.staff_id)
    }));
    const { error } = await supabase.from('attendance').upsert(attendanceToInsert);
    if (error) console.error('Error inserting attendance:', error);
    else console.log('Attendance migrated successfully.');
  }

  console.log('Migration script finished.');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
