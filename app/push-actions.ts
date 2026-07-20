'use server';

import { createClient } from "@/utils/supabase/server";

// Save the subscription to the current logged-in user or customer
export async function savePushSubscription(subscription: any) {
  try {
    const supabase = await createClient();
    
    // Check if it's an authenticated user (Staff/Admin)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (user && !authError) {
      // Update user table
      const { error } = await supabase
        .from('users')
        .update({ notification_token: subscription })
        .eq('id', user.id);
        
      if (error) throw error;
      return { success: true };
    }

    // Usually, customers might just have a phone session or not fully auth'd.
    // If you have a way to identify the current customer (e.g. via cookies or a customer token), you would update here.
    // For this example, if there's no auth user, we might not know who to attach it to,
    // so we return an instruction that customer needs to be identified.
    return { success: false, error: 'User not authenticated' };
    
  } catch (error: unknown) {
    console.error('Error saving push subscription:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// Function to save subscription for an anonymous customer booking
export async function saveCustomerPushSubscription(customerId: string, subscription: any) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('customers')
      .update({ notification_token: subscription })
      .eq('id', customerId);
      
    if (error) throw error;
    return { success: true };
  } catch (error: unknown) {
    console.error('Error saving customer push subscription:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
