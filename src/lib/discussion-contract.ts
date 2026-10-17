export const DEFAULT_CHANNEL_SLUGS = {
  safe: 'sem-spoilers',
  spoilers: 'com-spoilers',
} as const;

export type DiscussionEntryResult =
  | { ok: true; href: string }
  | {
      ok: false;
      code: 'unauthenticated' | 'invalid_input' | 'unavailable';
      message: string;
      loginHref?: string;
    };
