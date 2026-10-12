import * as Sentry from '@sentry/nextjs';

const sample = Number(
  process.env.SENTRY_TRACES_SAMPLE_RATE ??
    (process.env.NODE_ENV === 'production' ? 0.1 : 1),
);

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
  release: process.env.SENTRY_RELEASE ?? process.env.VERCEL_GIT_COMMIT_SHA,
  tracesSampleRate: Number.isFinite(sample) ? Math.max(0, Math.min(1, sample)) : 0.1,
  beforeSend(event) {
    if (event.request) {
      delete event.request.data;
      delete event.request.cookies;
      delete event.request.headers;
      if (event.request.url) {
        try {
          const url = new URL(event.request.url);
          url.search = '';
          url.hash = '';
          event.request.url = url.toString();
        } catch {
          // Ignorar apenas a sanitização da URL inválida.
        }
      }
    }
    if (event.user) event.user = event.user.id ? { id: event.user.id } : undefined;
    return event;
  },
});
