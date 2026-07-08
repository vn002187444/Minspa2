'use server'

import {
  createClient, getSession, format, subDays, eachDayOfInterval,
  startOfMonth, endOfMonth, checkAdminOrManager, StaffReportEntry,
} from "./_shared";

export async function getDashboardData(startDateStr?: string, endDateStr?: string) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    throw new Error('Unauthorized');
  }
  const userRole = session.user.role;
  const supabase = await createClient();
  const today = new Date();

  const startRange = startDateStr ? new Date(startDateStr).toISOString() : startOfMonth(today).toISOString();
  const endRange = endDateStr ? new Date(endDateStr).toISOString() : endOfMonth(today).toISOString();

  const startRangeDay = startDateStr ? format(new Date(startDateStr), 'yyyy-MM-dd') : format(startOfMonth(today), 'yyyy-MM-dd');
  const endRangeDay = endDateStr ? format(new Date(endDateStr), 'yyyy-MM-dd') : format(endOfMonth(today), 'yyyy-MM-dd');

  try {
    const { data: appts, error: err1 } = await supabase
      .from('appointments')
      .select(`
        id, total_amount, commission_amount, tip_amount, created_at, start_time, status, staff_id,
        users!appointments_staff_id_fkey(full_name),
        customers(full_name)
      `)
      .eq('status', 'COMPLETED')
      .gte('start_time', startRange)
      .lte('start_time', endRange)
      .limit(1000);

    if (err1) throw err1;

    let totalRevenue = 0;
    let totalCommission = 0;
    let totalTip = 0;
    let totalCompleted = 0;

    if (appts) {
      totalCompleted = appts.length;
      appts.forEach((app: any) => {
        totalRevenue += Number(app.total_amount) || 0;
        totalCommission += Number(app.commission_amount) || 0;
        totalTip += Number(app.tip_amount) || 0;
      });
    }

    const todayVNStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(today);

    const startOfTodayISO = new Date(`${todayVNStr}T00:00:00+07:00`).toISOString();
    const endOfTodayISO = new Date(`${todayVNStr}T23:59:59.999+07:00`).toISOString();

    const { count: pendingCount, error: err2 } = await supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .in('status', ['PENDING_RANDOM', 'CONFIRMED'])
      .gte('start_time', startOfTodayISO)
      .lte('start_time', endOfTodayISO);

    if (err2) throw err2;

    const { count: presentCount, error: err3 } = await supabase
      .from('attendance')
      .select('id', { count: 'exact', head: true })
      .eq('date', todayVNStr)
      .eq('status', 'PRESENT');

    if (err3) throw err3;

    const { data: attendanceLog } = await supabase
      .from('attendance')
      .select(`
        id, staff_id, date, status, check_in_time,
        users!attendance_staff_id_fkey(full_name)
      `)
      .gte('date', startRangeDay)
      .lte('date', endRangeDay)
      .order('date', { ascending: false })
      .limit(500);

    const { data: todayAppts } = await supabase
      .from('appointments')
      .select(`
        id, total_amount, start_time, status, staff_id,
        users!appointments_staff_id_fkey(full_name),
        customers(full_name)
      `)
      .gte('start_time', startOfTodayISO)
      .lte('start_time', endOfTodayISO)
      .order('start_time', { ascending: true })
      .limit(100);

    const dailyRevenue: Record<string, number> = {};
    if (appts) {
      appts.forEach((app: any) => {
        const d = format(new Date(app.start_time), 'dd/MM');
        dailyRevenue[d] = (dailyRevenue[d] || 0) + (Number(app.total_amount) || 0);
      });
    }

    const startObj = new Date(startRangeDay);
    const endObj = new Date(endRangeDay);
    const diffTime = Math.abs(endObj.getTime() - startObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let chartData = [];
    if (diffDays >= 0 && diffDays <= 31) {
      try {
        chartData = eachDayOfInterval({ start: startObj, end: endObj }).map(d => {
          const dStr = format(d, 'dd/MM');
          return { name: dStr, value: dailyRevenue[dStr] || 0 };
        });
      } catch {
        chartData = eachDayOfInterval({ start: subDays(today, 6), end: today }).map(d => {
          const dStr = format(d, 'dd/MM');
          return { name: dStr, value: dailyRevenue[dStr] || 0 };
        });
      }
    } else {
      chartData = Object.entries(dailyRevenue)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    return {
      userRole,
      totalRevenue,
      totalCommission,
      totalTip,
      totalCompleted,
      pendingCount: pendingCount || 0,
      presentCount: presentCount || 0,
      chartData,
      attendanceLog: attendanceLog || [],
      appointmentsList: appts || [],
      todayAppointments: todayAppts || []
    };
  } catch (error: unknown) {
    console.error('Supabase query error:', error);
    return {
      userRole,
      totalRevenue: 0,
      totalCommission: 0,
      totalTip: 0,
      totalCompleted: 0,
      pendingCount: 0,
      presentCount: 0,
      chartData: eachDayOfInterval({ start: subDays(today, 6), end: today }).map(d => ({ name: format(d, 'dd/MM'), value: 0 })),
      attendanceLog: [],
      appointmentsList: [],
      todayAppointments: []
    };
  }
}

export async function getCommissionReport(startDateStr: string, endDateStr: string) {
  await checkAdminOrManager();
  const supabase = await createClient();
  try {
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        total_amount,
        commission_amount,
        tip_amount,
        start_time,
        status,
        staff_id,
        customers (full_name),
        users (id, full_name, username),
        appointment_services (
          services (name, price)
        )
      `)
      .eq('status', 'COMPLETED')
      .gte('start_time', startDateStr)
      .lte('start_time', endDateStr)
      .order('start_time', { ascending: false })
      .limit(1000);

    if (error) throw error;

    const { data: soldPackages } = await supabase
      .from('customer_packages')
      .select(`
        id,
        purchased_at,
        sold_by_staff_id,
        commission_amount,
        treatment_packages!package_id ( id, name, price, commission_percentage ),
        customers ( full_name )
      `)
      .gte('purchased_at', startDateStr)
      .lte('purchased_at', endDateStr)
      .limit(500);

    const { data: staffList } = await supabase
      .from('users')
      .select('id, full_name, username')
      .eq('role', 'STAFF')
      .eq('is_active', true)
      .limit(100);

    const staffMap: Record<string, StaffReportEntry> = {};
    if (staffList) {
      staffList.forEach((s: { id: string; full_name: string | null; username: string | null }) => {
        staffMap[s.id] = {
          staffId: s.id,
          fullName: s.full_name || s.username || 'N/A',
          username: s.username || '',
          totalAppointments: 0,
          totalSales: 0,
          totalCommission: 0,
          totalTip: 0,
          items: []
        };
      });
    }

    let grandTotalSales = 0;
    let grandTotalCommission = 0;
    let grandTotalTip = 0;
    let grandAppointmentsCount = 0;

    if (appointments) {
      appointments.forEach((app: any) => {
        const sId = app.staff_id;
        if (sId) {
          if (!staffMap[sId]) {
            staffMap[sId] = {
              staffId: sId,
              fullName: app.users?.full_name || app.users?.username || 'KTV chưa rõ',
              username: app.users?.username || '',
              totalAppointments: 0,
              totalSales: 0,
              totalCommission: 0,
              totalTip: 0,
              items: []
            };
          }

          const sales = Number(app.total_amount) || 0;
          const comm = Number(app.commission_amount) || 0;
          const tip = Number(app.tip_amount) || 0;

          staffMap[sId].totalAppointments += 1;
          staffMap[sId].totalSales += sales;
          staffMap[sId].totalCommission += comm;
          staffMap[sId].totalTip += tip;
          staffMap[sId].items.push({
            id: app.id,
            startTime: app.start_time,
            customerName: app.customers?.full_name || 'Khách lẻ',
            sales,
            commission: comm,
            tip,
            services: (app.appointment_services || []).map((as: any) => as.services?.name).filter(Boolean)
          });

          grandTotalSales += sales;
          grandTotalCommission += comm;
          grandTotalTip += tip;
          grandAppointmentsCount += 1;
        }
      });
    }

    if (soldPackages) {
      soldPackages.forEach((pkg: any) => {
        const sId = pkg.sold_by_staff_id;
        if (sId) {
          if (!staffMap[sId]) {
            staffMap[sId] = {
              staffId: sId,
              fullName: 'KTV chưa rõ',
              username: '',
              totalAppointments: 0,
              totalSales: 0,
              totalCommission: 0,
              totalTip: 0,
              items: []
            };
          }

          const sales = Number(pkg.treatment_packages?.price) || 0;
          const comm = Number(pkg.commission_amount) || 0;

          staffMap[sId].totalSales += sales;
          staffMap[sId].totalCommission += comm;
          staffMap[sId].items.push({
            id: pkg.id,
            startTime: pkg.purchased_at,
            customerName: pkg.customers?.full_name || 'Khách mua gói',
            sales,
            commission: comm,
            tip: 0,
            services: [`Bán gói: ${pkg.treatment_packages?.name || 'Gói liệu trình'}`]
          });

          grandTotalSales += sales;
          grandTotalCommission += comm;
        }
      });
    }

    return {
      success: true,
      data: {
        staffReports: Object.values(staffMap),
        grandTotalSales,
        grandTotalCommission,
        grandTotalTip,
        grandAppointmentsCount
      }
    };
  } catch (error: unknown) {
    console.error("Commission Report aggregation error:", error);
    return { success: false, error: error instanceof Error ? error.message : 'Lỗi khi lấy báo cáo hoa hồng' };
  }
}

export async function getAdvancedRevenueReport(startDate: string, endDate: string) {
  await checkAdminOrManager();
  const supabase = await createClient();

  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      id, start_time, total_amount, discount_amount, tip_amount, commission_amount, status, staff_id,
      users!appointments_staff_id_fkey(full_name),
      customers(full_name, phone),
      appointment_services(
        id, price, discount_amount,
        services(id, name)
      )
    `)
    .gte('start_time', startDate)
    .lte('start_time', endDate)
    .eq('status', 'COMPLETED')
    .limit(5000);

  if (!appointments) {
    return { revenueByDay: [], revenueByService: [], revenueByStaff: [], totalRevenue: 0, totalAppointments: 0 };
  }

  const revenueByDayMap: Record<string, number> = {};
  const revenueByServiceMap: Record<string, { name: string; revenue: number; count: number }> = {};
  const revenueByStaffMap: Record<string, { name: string; revenue: number; tip: number; count: number }> = {};
  let totalRevenue = 0;
  let totalTip = 0;
  let totalDiscount = 0;

  for (const appt of appointments) {
    const day = appt.start_time?.slice(0, 10);
    const netRevenue = (appt.total_amount || 0) - (appt.discount_amount || 0);
    totalRevenue += netRevenue;
    totalTip += appt.tip_amount || 0;
    totalDiscount += appt.discount_amount || 0;

    if (day) revenueByDayMap[day] = (revenueByDayMap[day] || 0) + netRevenue;

    const usersArr = (appt.users as any) || [];
    const staffName = Array.isArray(usersArr) ? (usersArr[0]?.full_name || 'N/A') : (usersArr?.full_name || 'N/A');
    if (!revenueByStaffMap[appt.staff_id]) {
      revenueByStaffMap[appt.staff_id] = { name: staffName, revenue: 0, tip: 0, count: 0 };
    }
    revenueByStaffMap[appt.staff_id].revenue += netRevenue;
    revenueByStaffMap[appt.staff_id].tip += appt.tip_amount || 0;
    revenueByStaffMap[appt.staff_id].count += 1;

    for (const as of (appt.appointment_services || [])) {
      const svc = as.services as any;
      if (!svc?.name) continue;
      if (!revenueByServiceMap[svc.name]) {
        revenueByServiceMap[svc.name] = { name: svc.name, revenue: 0, count: 0 };
      }
      revenueByServiceMap[svc.name].revenue += (as.price || 0) - (as.discount_amount || 0);
      revenueByServiceMap[svc.name].count += 1;
    }
  }

  const revenueByDay = Object.entries(revenueByDayMap)
    .map(([date, value]) => ({ date, value: Math.round(value) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const revenueByService = Object.values(revenueByServiceMap)
    .sort((a, b) => b.revenue - a.revenue);

  const revenueByStaff = Object.values(revenueByStaffMap)
    .sort((a, b) => b.revenue - a.revenue);

  return {
    revenueByDay,
    revenueByService,
    revenueByStaff,
    totalRevenue: Math.round(totalRevenue),
    totalTip: Math.round(totalTip),
    totalDiscount: Math.round(totalDiscount),
    totalAppointments: appointments.length,
  };
}

export async function getCustomerAnalytics(startDate: string, endDate: string) {
  await checkAdminOrManager();
  const supabase = await createClient();

  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      id, total_amount, discount_amount, tip_amount, status, start_time,
      customers!inner(id, full_name, phone, created_at)
    `)
    .gte('start_time', startDate)
    .lte('start_time', endDate)
    .eq('status', 'COMPLETED')
    .limit(5000);

  if (!appointments) {
    return { topCustomers: [], customerStats: { total: 0, newCount: 0, returningCount: 0, avgVisits: 0 } };
  }

  const customerMap: Record<string, { id: string; name: string; phone: string; totalSpent: number; visits: number; firstVisit: string }> = {};
  const newCustomers = new Set<string>();

  for (const appt of appointments) {
    const c = appt.customers as any;
    if (!c?.id) continue;
    if (!customerMap[c.id]) {
      customerMap[c.id] = { id: c.id, name: c.full_name || 'N/A', phone: c.phone || '', totalSpent: 0, visits: 0, firstVisit: c.created_at || appt.start_time };
    }
    customerMap[c.id].totalSpent += (appt.total_amount || 0) - (appt.discount_amount || 0);
    customerMap[c.id].visits += 1;
  }

  const now = new Date();
  for (const c of Object.values(customerMap)) {
    const created = new Date(c.firstVisit);
    const daysSinceCreated = Math.floor((now.getTime() - created.getTime()) / 86400000);
    if (daysSinceCreated <= 30) newCustomers.add(c.id);
  }

  const topCustomers = Object.values(customerMap)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 20)
    .map(c => ({ ...c, totalSpent: Math.round(c.totalSpent) }));

  const uniqueCustomers = Object.keys(customerMap).length;

  return {
    topCustomers,
    customerStats: {
      total: uniqueCustomers,
      newCount: newCustomers.size,
      returningCount: uniqueCustomers - newCustomers.size,
      avgVisits: uniqueCustomers > 0 ? Math.round((appointments.length / uniqueCustomers) * 10) / 10 : 0,
    },
  };
}

export async function getGrowthComparison(startDate: string, endDate: string, compareStartDate: string, compareEndDate: string) {
  await checkAdminOrManager();
  const supabase = await createClient();

  const fetchPeriod = async (s: string, e: string) => {
    const { data } = await supabase
      .from('appointments')
      .select('id, total_amount, discount_amount, tip_amount, start_time, status')
      .gte('start_time', s)
      .lte('start_time', e)
      .eq('status', 'COMPLETED')
      .limit(5000);
    if (!data) return { revenue: 0, count: 0, tip: 0, byDay: [] as { date: string; value: number }[] };
    let rev = 0;
    let tip = 0;
    const dayMap: Record<string, number> = {};
    for (const a of data) {
      rev += (a.total_amount || 0) - (a.discount_amount || 0);
      tip += a.tip_amount || 0;
      const d = a.start_time?.slice(0, 10);
      if (d) dayMap[d] = (dayMap[d] || 0) + (a.total_amount || 0) - (a.discount_amount || 0);
    }
    const byDay = Object.entries(dayMap).map(([date, value]) => ({ date, value: Math.round(value) })).sort((a, b) => a.date.localeCompare(b.date));
    return { revenue: Math.round(rev), count: data.length, tip: Math.round(tip), byDay };
  };

  const [current, previous] = await Promise.all([
    fetchPeriod(startDate, endDate),
    fetchPeriod(compareStartDate, compareEndDate),
  ]);

  const revenueChange = previous.revenue > 0 ? Math.round(((current.revenue - previous.revenue) / previous.revenue) * 100 * 10) / 10 : 0;
  const countChange = previous.count > 0 ? Math.round(((current.count - previous.count) / previous.count) * 100 * 10) / 10 : 0;

  return {
    current,
    previous,
    revenueChange,
    countChange,
  };
}

export async function getFinancialDashboard(startDateStr?: string, endDateStr?: string) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    throw new Error('Unauthorized');
  }
  const supabase = await createClient();
  const now = new Date();

  const start = startDateStr ? new Date(startDateStr).toISOString() : startOfMonth(now).toISOString();
  const end = endDateStr ? new Date(endDateStr).toISOString() : endOfMonth(now).toISOString();

  const { data: appts } = await supabase
    .from('appointments')
    .select('total_amount, commission_amount, tip_amount, discount_amount, start_time, status')
    .eq('status', 'COMPLETED')
    .gte('start_time', start)
    .lte('start_time', end)
    .limit(5000);

  const totalRevenue = (appts || []).reduce((s, a: any) => s + (Number(a.total_amount) || 0), 0);
  const totalCommission = (appts || []).reduce((s, a: any) => s + (Number(a.commission_amount) || 0), 0);
  const totalTip = (appts || []).reduce((s, a: any) => s + (Number(a.tip_amount) || 0), 0);
  const totalDiscount = (appts || []).reduce((s, a: any) => s + (Number(a.discount_amount) || 0), 0);
  const totalOrders = (appts || []).length;
  const netProfit = totalRevenue - totalCommission - totalDiscount;

  const monthlyMap: Record<string, { revenue: number; commission: number; orders: number }> = {};
  (appts || []).forEach((a: any) => {
    const m = format(new Date(a.start_time), 'yyyy-MM');
    if (!monthlyMap[m]) monthlyMap[m] = { revenue: 0, commission: 0, orders: 0 };
    monthlyMap[m].revenue += Number(a.total_amount) || 0;
    monthlyMap[m].commission += Number(a.commission_amount) || 0;
    monthlyMap[m].orders += 1;
  });

  const monthlyCashFlow = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      revenue: data.revenue,
      commission: data.commission,
      netCashflow: data.revenue - data.commission,
      orders: data.orders,
    }));

  return { totalRevenue, totalCommission, totalTip, totalDiscount, totalOrders, netProfit, monthlyCashFlow };
}

export async function getTaxReport(year?: number) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    throw new Error('Unauthorized');
  }
  const supabase = await createClient();
  const yearVal = year || new Date().getFullYear();

  const startISO = new Date(`${yearVal}-01-01T00:00:00+07:00`).toISOString();
  const endISO = new Date(`${yearVal}-12-31T23:59:59+07:00`).toISOString();

  const { data: appts } = await supabase
    .from('appointments')
    .select('total_amount, commission_amount, tip_amount, start_time, status')
    .eq('status', 'COMPLETED')
    .gte('start_time', startISO)
    .lte('start_time', endISO)
    .limit(10000);

  const monthlyData: Record<string, { revenue: number; orders: number; commission: number; tip: number }> = {};
  for (let m = 1; m <= 12; m++) {
    const key = `${yearVal}-${String(m).padStart(2, '0')}`;
    monthlyData[key] = { revenue: 0, orders: 0, commission: 0, tip: 0 };
  }

  (appts || []).forEach((a: any) => {
    const m = format(new Date(a.start_time), 'yyyy-MM');
    if (monthlyData[m]) {
      monthlyData[m].revenue += Number(a.total_amount) || 0;
      monthlyData[m].orders += 1;
      monthlyData[m].commission += Number(a.commission_amount) || 0;
      monthlyData[m].tip += Number(a.tip_amount) || 0;
    }
  });

  const months = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, ...data }));

  const totalRevenue = months.reduce((s, m) => s + m.revenue, 0);
  const totalOrders = months.reduce((s, m) => s + m.orders, 0);

  return { year: yearVal, months, totalRevenue, totalOrders };
}
