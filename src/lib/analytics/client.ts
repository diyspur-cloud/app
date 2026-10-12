'use client';

import posthog from 'posthog-js';
import { readAnalyticsConsent } from './consent';
import type { AnalyticsEvent } from './events';
import { sanitizeAnalyticsProperties } from './events';

let initialized = false;

export function initializePostHog(): boolean {
  if (typeof window === 'undefined' || readAnalyticsConsent() !== 'granted') return false;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (!key || !host) return false;

  if (!initialized) {
    posthog.init(key, {
      api_host: host,
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      respect_dnt: true,
      person_profiles: 'identified_only',
    });
    initialized = true;
  } else {
    posthog.opt_in_capturing();
  }
  return true;
}

export function disablePostHog(): void {
  if (initialized) posthog.opt_out_capturing();
}

export function captureAnalyticsEvent(
  event: AnalyticsEvent,
  properties: Record<string, string | number | boolean> = {},
): void {
  if (!initialized || readAnalyticsConsent() !== 'granted') return;
  posthog.capture(event, sanitizeAnalyticsProperties(event, properties));
}

export function identifyAnalyticsUser(userId: string): void {
  if (!initialized || readAnalyticsConsent() !== 'granted') return;
  posthog.identify(userId);
}

export function resetAnalyticsIdentity(): void {
  if (initialized) posthog.reset();
}

export function isPostHogInitialized(): boolean {
  return initialized;
}
