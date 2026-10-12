export type AnalyticsEvent =
  | 'page_viewed'
  | 'landing_page_viewed'
  | 'search_performed'
  | 'content_viewed'
  | 'content_shared'
  | 'favorite_added'
  | 'favorite_removed'
  | 'cta_clicked'
  | 'sign_up_started'
  | 'sign_up_completed'
  | 'login_completed'
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'activation_completed'
  | 'return_session_started';

export const ALLOWED_PROPERTIES: Record<AnalyticsEvent, readonly string[]> = {
  page_viewed: ['page_path', 'page_type'],
  landing_page_viewed: ['source', 'referrer_category'],
  search_performed: ['query_length', 'result_count', 'search_scope'],
  content_viewed: ['content_category', 'content_type'],
  content_shared: ['content_type', 'share_channel'],
  favorite_added: ['content_type'],
  favorite_removed: ['content_type'],
  cta_clicked: ['cta_id', 'page_type', 'placement'],
  sign_up_started: ['auth_method'],
  sign_up_completed: ['auth_method'],
  login_completed: ['auth_method'],
  onboarding_started: ['step_id'],
  onboarding_completed: ['step_id'],
  activation_completed: ['activation_version'],
  return_session_started: ['session_type'],
};

export function sanitizeAnalyticsProperties(
  event: AnalyticsEvent,
  input: Record<string, string | number | boolean>,
): Record<string, string | number | boolean> {
  const allowed = ALLOWED_PROPERTIES[event] ?? [];
  const output: Record<string, string | number | boolean> = {};
  for (const key of allowed) {
    const value = input[key];
    if (typeof value === 'string') output[key] = value.slice(0, 100);
    else if (typeof value === 'number' && Number.isFinite(value)) output[key] = value;
    else if (typeof value === 'boolean') output[key] = value;
  }
  return output;
}
