'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export default function ViewTracker({ postId }: { postId: string }) {
  useEffect(() => {
    fetch('/api/blog/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId }),
    }).catch(e => logger.error('[Analytics] Failed to track blog view', e));
  }, [postId]);

  return null;
}
