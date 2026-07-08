'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { trackEvent } from '@/lib/analytics';

export default function WebVitals() {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Web Vital:', metric.name, Math.round(metric.value));
    }
    trackEvent('web_vital', {
      metric_name: metric.name,
      metric_value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      metric_rating: metric.rating,
      metric_label: metric.label,
      non_interaction: true,
    });
  });

  return null;
}