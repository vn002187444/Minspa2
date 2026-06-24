import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/utils/auth';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { subscription, userId, customerId } = await req.json();

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription object is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Determine the user ID to associate
    let targetUserId = userId;
    
    // If no userId is sent, try getting from the current session (for staff, admins, etc.)
    if (!targetUserId && !customerId) {
      const session = await getSession();
      if (session?.user?.id) {
        targetUserId = session.user.id;
      }
    }

    if (!targetUserId && !customerId) {
      return NextResponse.json({ 
        success: false, 
        message: 'No authenticated user or customer identified to link. Storing subscription deferred.' 
      });
    }

    let resultError = null;

    if (targetUserId) {
      const { error } = await supabase
        .from('users')
        .update({ notification_token: subscription })
        .eq('id', targetUserId);
      if (error) resultError = error.message;
    } else if (customerId) {
      const { error } = await supabase
        .from('customers')
        .update({ notification_token: subscription })
        .eq('id', customerId);
      if (error) resultError = error.message;
    }

    if (!resultError) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: resultError }, { status: 400 });
    }
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

