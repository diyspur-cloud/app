'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { createBrowserSupabase } from '@/lib/supabase/browser';
import * as Sentry from '@sentry/nextjs';
import {
  captureAnalyticsEvent,
  disablePostHog,
  identifyAnalyticsUser,
  initializePostHog,
  resetAnalyticsIdentity,
} from '@/lib/analytics/client';
import { analyticsConsentEventName, readAnalyticsConsent } from '@/lib/analytics/consent';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const syncConsent = () => {
      if (readAnalyticsConsent() !== 'granted') {
        disablePostHog();
        return;
      }
      initializePostHog();
      captureAnalyticsEvent('page_viewed', {
        page_path: window.location.pathname,
        page_type: pathname === '/' ? 'landing' : 'content',
      });
    };

    syncConsent();
    window.addEventListener(analyticsConsentEventName(), syncConsent);

    // Mantém o UUID estável, mas nunca envia email ou metadata editável.
    const supabase = createBrowserSupabase();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        resetAnalyticsIdentity();
        Sentry.setUser(null);
      }
      if (session?.user?.id) {
        identifyAnalyticsUser(session.user.id);
        Sentry.setUser({ id: session.user.id });
      }
    });

    return () => {
      window.removeEventListener(analyticsConsentEventName(), syncConsent);
      subscription.unsubscribe();
    };
  }, [pathname]);

  return children;
}
