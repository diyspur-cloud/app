export type AnalyticsConsent = 'granted' | 'denied';

const STORAGE_KEY = 'diyspur.analytics-consent.v1';
const CHANGE_EVENT = 'diyspur:analytics-consent-changed';

export function readAnalyticsConsent(): AnalyticsConsent | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    return null;
  }
}

export function saveAnalyticsConsent(value: AnalyticsConsent): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } finally {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: value }));
  }
}

export function analyticsConsentEventName(): string {
  return CHANGE_EVENT;
}
