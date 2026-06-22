import { createClient } from '@/utils/supabase/server';

export type BackgroundTask = {
  type: 'payment_notification' | 'booking_confirmation' | 'reminder_check' | 'send_marketing_push';
  payload: Record<string, unknown>;
};

export async function enqueueTask(task: BackgroundTask) {
  const supabase = await createClient();
  const { error } = await supabase.rpc('enqueue_background_task', {
    task_type: task.type,
    task_payload: JSON.stringify(task.payload),
  });
  if (error) {
    console.error('[Queue] Failed to enqueue:', error);
    throw new Error(`Enqueue failed: ${error.message}`);
  }
}

export async function enqueueTaskBatch(tasks: BackgroundTask[]) {
  await Promise.allSettled(tasks.map(enqueueTask));
}
