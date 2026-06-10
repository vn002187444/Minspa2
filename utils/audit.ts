import { createClient } from "./supabase/server";

export async function logAuditAction(userId: string, actionCategory: string, details: string) {
  try {
    const supabase = await createClient();
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: actionCategory,
      details: details,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error("Failed to insert audit log", error);
  }
}
