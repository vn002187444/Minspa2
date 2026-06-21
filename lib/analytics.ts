type GtagParams = Record<string, string | number | boolean>;

export const trackEvent = (eventName: string, params: GtagParams) => {
  if (typeof window !== 'undefined') {
    const w = window as { gtag?: (cmd: string, event: string, params: GtagParams) => void };
    w.gtag?.('event', eventName, params);
  }
};
