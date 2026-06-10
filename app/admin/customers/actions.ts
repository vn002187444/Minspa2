'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function getCustomers(page = 1, limit = 20, searchTerm = '') {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {}
        },
      },
    }
  );

  let query = supabase.from('customers').select('id, full_name, phone, created_at', { count: 'exact' });

  if (searchTerm) {
    query = query.or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Error fetching customers:', error);
    return { data: [], count: 0 };
  }

  // Pre-fetch latest appointment dates for these customers
  const customerIds = data.map(c => c.id);
  if (customerIds.length > 0) {
    const { data: latestAppts } = await supabase
      .from('appointments')
      .select('customer_id, start_time')
      .in('customer_id', customerIds)
      .eq('status', 'COMPLETED')
      .order('start_time', { ascending: false });

    // Map latest date
    const customersWithVisit = data.map(c => {
      const appt = latestAppts?.find(a => a.customer_id === c.id);
      return { ...c, last_visit: appt ? appt.start_time : null };
    });
    
    return { data: customersWithVisit, count: count || 0 };
  }

  return { data, count: count || 0 };
}

export async function getCustomerStats(customerId: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {}
        },
      },
    }
  );

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('id, start_time, total_amount, appointment_services(services(name))')
    .eq('customer_id', customerId)
    .eq('status', 'COMPLETED')
    .order('start_time', { ascending: false });

  if (error) {
    console.error('Error fetching customer stats:', error);
    return null;
  }

  const { data: customerData } = await supabase
    .from('customers')
    .select('full_name, phone, created_at')
    .eq('id', customerId)
    .single();

  const totalVisits = appointments.length;
  let totalSpent = 0;
  const monthlySpent: Record<string, number> = {};
  const serviceCounts: Record<string, number> = {};

  // For computing frequency
  let firstVisit: Date | null = null;
  let latestVisit: Date | null = null;

  appointments.forEach(app => {
    totalSpent += app.total_amount || 0;

    const date = new Date(app.start_time);
    if (!firstVisit || date < firstVisit) firstVisit = date;
    if (!latestVisit || date > latestVisit) latestVisit = date;

    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlySpent[monthKey] = (monthlySpent[monthKey] || 0) + (app.total_amount || 0);

    app.appointment_services?.forEach((as: any) => {
      if (as.services?.name) {
        serviceCounts[as.services.name] = (serviceCounts[as.services.name] || 0) + 1;
      }
    });
  });

  // Calculate frequency
  let avgDaysBetweenVisits = null;
  if (totalVisits > 1 && firstVisit && latestVisit) {
    const daysDiff = ((latestVisit as Date).getTime() - (firstVisit as Date).getTime()) / (1000 * 3600 * 24);
    avgDaysBetweenVisits = Math.round(daysDiff / (totalVisits - 1));
  }

  // Top services
  const sortedServices = Object.entries(serviceCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  // Formatted monthly data (for 2026 or all time)
  const chartData = Object.entries(monthlySpent)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, amount]) => ({ month, amount }));

  // Recent 3 appointments detail
  const { data: recentBills } = await supabase
    .from('appointments')
    .select('id, start_time, total_amount, users(full_name), appointment_services(services(name))')
    .eq('customer_id', customerId)
    .eq('status', 'COMPLETED')
    .order('start_time', { ascending: false })
    .limit(5);

  return {
    customer: customerData,
    totalVisits,
    totalSpent,
    avgDaysBetweenVisits,
    topServices: sortedServices.slice(0, 5),
    chartData,
    recentBills,
  };
}
