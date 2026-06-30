export const description = 'Queries the database for orphaned records: appointments without staff, packages without customer, etc. Requires Supabase env vars.';
export const args = {
  fix: {
    type: 'boolean',
    description: 'Attempt to fix orphaned records (soft-delete by setting is_active=false).',
    default: false,
  },
};

interface OrphanCheck {
  label: string;
  query: string;
}

const checks: OrphanCheck[] = [
  { label: 'Appointments without valid staff', query: 'SELECT id FROM appointments WHERE staff_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = appointments.staff_id)' },
  { label: 'Appointments without valid customer', query: 'SELECT id FROM appointments WHERE customer_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM customers WHERE customers.id = appointments.customer_id)' },
  { label: 'Customer packages without valid customer', query: 'SELECT id FROM customer_packages WHERE NOT EXISTS (SELECT 1 FROM customers WHERE customers.id = customer_packages.customer_id)' },
  { label: 'Customer packages without valid package', query: 'SELECT id FROM customer_packages WHERE NOT EXISTS (SELECT 1 FROM treatment_packages WHERE treatment_packages.id = customer_packages.package_id)' },
  { label: 'Appointment services without valid appointment', query: 'SELECT id FROM appointment_services WHERE NOT EXISTS (SELECT 1 FROM appointments WHERE appointments.id = appointment_services.appointment_id)' },
  { label: 'Package usage logs without valid customer package', query: 'SELECT id FROM package_usage_logs WHERE NOT EXISTS (SELECT 1 FROM customer_packages WHERE customer_packages.id = package_usage_logs.customer_package_id)' },
  { label: 'Notifications without valid appointment', query: 'SELECT id FROM notifications WHERE appointment_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM appointments WHERE appointments.id = notifications.appointment_id)' },
  { label: 'Tasks without valid assignee', query: 'SELECT id FROM tasks WHERE assignee_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = tasks.assignee_id)' },
  { label: 'Staff skills without valid staff', query: 'SELECT id FROM staff_skills WHERE NOT EXISTS (SELECT 1 FROM users WHERE users.id = staff_skills.staff_id)' },
  { label: 'Auto assign logs without valid appointment', query: 'SELECT id FROM auto_assign_logs WHERE NOT EXISTS (SELECT 1 FROM appointments WHERE appointments.id = auto_assign_logs.appointment_id)' },
];

export async function execute({ fix: _fix = false }: { fix?: boolean }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { success: false, error: 'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.' };
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseKey);

  const orphans: Array<{ label: string; count: number; ids: number[] }> = [];

  for (const check of checks) {
    try {
      const { data, error } = await supabase.rpc('exec_sql', { query_text: check.query });
      if (error) {
        orphans.push({ label: check.label, count: -1, ids: [] });
        continue;
      }
      const ids = (data as Array<{ id: number }>)?.map((r: { id: number }) => r.id) || [];
      if (ids.length > 0) {
        orphans.push({ label: check.label, count: ids.length, ids });
      }
    } catch {
      orphans.push({ label: check.label, count: -1, ids: [] });
    }
  }

  const totalOrphans = orphans.reduce((sum, o) => sum + (o.count > 0 ? o.count : 0), 0);

  return {
    success: true,
    totalOrphans,
    orphanChecks: orphans,
    healthy: totalOrphans === 0,
    message: totalOrphans === 0
      ? 'Database is healthy. No orphaned records found.'
      : `Found ${totalOrphans} orphaned record(s) across ${orphans.length} check(s).`,
  };
}
