if (process.env.SENTRY_DSN) {
  import('@sentry/nextjs').then(Sentry => {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
      ignoreErrors: [
        'NEXT_REDIRECT',
        'NEXT_NOT_FOUND',
      ],
    });
  });
}
