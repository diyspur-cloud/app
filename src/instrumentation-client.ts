import * as Sentry from '@sentry/nextjs';

const tracesSampleRate = Number(
  process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ??
    (process.env.NODE_ENV === 'production' ? 0.1 : 1),
);

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_RELEASE || undefined,
  tracesSampleRate: Number.isFinite(tracesSampleRate)
    ? Math.max(0, Math.min(1, tracesSampleRate))
    : 0.1,
  beforeSend(event) {
    // Não enviar corpos/cookies. Remover query string de URLs de requisição.
    if (event.request) {
      delete event.request.data;
      delete event.request.cookies;
      if (event.request.url) {
        try {
          const url = new URL(event.request.url);
          url.search = '';
          url.hash = '';
          event.request.url = url.toString();
        } catch {
          // URL inválida não deve impedir o envio do evento técnico.
        }
      }
    }
    // Manter apenas o identificador pseudonimizado, se tiver sido configurado.
    if (event.user) {
      event.user = event.user.id ? { id: event.user.id } : undefined;
    }
    return event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
