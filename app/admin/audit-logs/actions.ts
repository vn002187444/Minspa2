'use server'

import { createClient } from "@/utils/supabase/server";
import { getSession } from "@/utils/auth";
import { format } from "date-fns";

export async function getAuditLogs() {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    throw new Error('Unauthorized');
  }
  
  try {
    const supabase = await createClient();
    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('*, users(full_name)')
      .order('created_at', { ascending: false })
      .limit(100);
      
    if (error) throw error;
    
    return (logs || []).map((l: any) => ({
      ...l,
      user_name: l.users?.full_name || l.user_id,
      date_formatted: format(new Date(l.created_at), 'dd/MM/yyyy HH:mm:ss')
    }));
  } catch (error) {
    console.error("Failed to load audit logs", error);
    return [];
  }
}
