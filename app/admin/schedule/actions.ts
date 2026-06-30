'use server'

import { createClient } from "@/utils/supabase/server";
import { getSession } from "@/utils/auth";

export async function getScheduleData(dateStr?: string) {
  let session = null;
  try {
    session = await getSession();
    } catch {
    // anonymous user is fine
  }

  const isStaffOrAdmin = session && (session.user.role === 'STAFF' || session.user.role === 'ADMIN' || session.user.role === 'MANAGER');

  const supabase = await createClient();
  
  let formattedDateStr = dateStr;
  if (!formattedDateStr) {
    formattedDateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
  }

  const startISO = new Date(`${formattedDateStr}T00:00:00+07:00`).toISOString();
  const endISO = new Date(`${formattedDateStr}T23:59:59.999+07:00`).toISOString();

  try {
    // 1. Get staff present
    const { data: attendance } = await supabase
      .from('attendance')
      .select('staff_id')
      .eq('date', formattedDateStr)
      .eq('status', 'PRESENT')
      .limit(100);

    const presentStaffIds = attendance?.map((a: any) => a.staff_id) || [];

    // 2. Get all active staff & managers
    const { data: staffList } = await supabase
      .from('users')
      .select('id, full_name, username')
      .in('role', ['STAFF', 'MANAGER'])
      .eq('is_active', true)
      .limit(100);

    const finalStaffList = (staffList || []).map(staff => ({
      ...staff,
      is_present: presentStaffIds.includes(staff.id),
    }));

    // 3. Get today's appointments (exclude cancelled/completed)
    const { data: appointments } = await supabase
      .from('appointments')
      .select(`
        id, staff_id, status, start_time, end_time, actual_start_time, actual_end_time, total_amount,
        customers ( full_name, phone ),
        appointment_services (
          service_id,
          services ( id, name )
        )
      `)
      .not('status', 'in', ['CANCELLED', 'COMPLETED'])
      .order('start_time', { ascending: true })
      .gte('start_time', startISO)
      .lte('start_time', endISO)
      .limit(500);

    // 4. Filter sensitive details for guests
    const processedAppointments = (appointments || []).map((appt: any) => {
      if (!isStaffOrAdmin) {
        return {
          ...appt,
          total_amount: 0,
          customers: {
            full_name: "Khách đặt chỗ",
            phone: "Liên hệ cửa hàng"
          },
          appointment_services: (appt.appointment_services || []).map((as: any) => ({
            ...as,
            services: {
              id: as.services?.id || '',
              name: "Dịch vụ đã đặt"
            }
          }))
        };
      }
      return appt;
    });

    // 5. Get active services list
    const { data: services } = await supabase
      .from('services')
      .select('id, name, price')
      .eq('is_active', true)
      .limit(200);

    // 6. Get explicit time slot locks for the day
    const { data: timeSlotLocks } = await supabase
      .from('time_slot_locks')
      .select('id, staff_id, appointment_id, start_time, end_time')
      .eq('lock_date', formattedDateStr)
      .eq('is_active', true)
      .limit(500);

    return { 
      staffList: finalStaffList, 
      appointments: processedAppointments,
      allServices: services || [],
      timeSlotLocks: timeSlotLocks || []
    };
  } catch (error) {
    console.error('getScheduleData Error:', error);
    return { staffList: [], appointments: [], allServices: [] };
  }
}
