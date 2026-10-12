'use client';

import { useEffect, useState } from 'react';
import { readAnalyticsConsent, saveAnalyticsConsent, type AnalyticsConsent } from '@/lib/analytics/consent';

export function AnalyticsConsentBanner() {
  const [choice, setChoice] = useState<AnalyticsConsent | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const current = readAnalyticsConsent();
    setChoice(current);
    setOpen(current === null);
  }, []);

  function choose(value: AnalyticsConsent) {
    saveAnalyticsConsent(value);
    setChoice(value);
    setOpen(false);
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          className="privacy-preferences-trigger"
          onClick={() => setOpen(true)}
          aria-label="Alterar preferências de analytics"
        >
          Preferências de privacidade
        </button>
      )}
      {open && (
        <aside
          role="dialog"
          aria-modal="false"
          aria-labelledby="analytics-consent-title"
          className="analytics-consent"
        >
          <h2 id="analytics-consent-title">Ajude a melhorar o DIYSPUR</h2>
          <p>
            Analytics opcional ajuda a entender uso e falhas. A escolha pode ser alterada depois.
            Recusar não impede o uso do clube.
          </p>
          <div className="analytics-consent-actions">
            <button type="button" onClick={() => choose('granted')}>
              Aceitar analytics
            </button>
            <button type="button" onClick={() => choose('denied')}>
              Recusar
            </button>
            {choice !== null && (
              <button type="button" onClick={() => setOpen(false)}>
                Cancelar
              </button>
            )}
          </div>
        </aside>
      )}
    </>
  );
}
