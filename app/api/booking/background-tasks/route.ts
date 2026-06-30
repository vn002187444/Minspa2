import { NextResponse } from 'next/server';
import { enqueueTask } from '@/lib/queue';
import { getSession } from '@/utils/auth';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const { appointmentId, customerId, staffId, commission, total: _total, discountedTotal, staffName: _staffName, customerName, appointmentDate, appointmentTime } = body;

    if (!appointmentId) {
      return NextResponse.json({ error: 'Missing appointmentId' }, { status: 400 });
    }

    const tasks = [];

    if (customerId) {
      tasks.push(enqueueTask({
        type: 'payment_notification',
        payload: { customerId, staffId, appointmentId, customerName, commission, discountedTotal, appointmentDate, appointmentTime },
      }));
    }

    if (staffId) {
      tasks.push(enqueueTask({
        type: 'payment_notification',
        payload: { customerId, staffId, appointmentId, customerName, commission, discountedTotal, appointmentDate, appointmentTime },
      }));
    }

    tasks.push(enqueueTask({
      type: 'reminder_check',
      payload: {},
    }));

    await Promise.allSettled(tasks);

    return NextResponse.json({ success: true, message: 'Background tasks queued via pgmq' });
  } catch (error: unknown) {
    console.error('[Background Tasks] Error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
