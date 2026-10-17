import { describe, it, expect } from 'vitest';
import { DEFAULT_CHANNEL_SLUGS } from '@/lib/discussion-contract';
import { groupEntryHref, groupEntryContextSchema } from '@/lib/group-entry-context';
import { openBookDiscussionSchema, openChapterDiscussionSchema } from '@/features/discussions/schemas';

describe('Discussion Contract and Canonical Routing', () => {
  it('enforces canonical slugs sem-spoilers and com-spoilers', () => {
    expect(DEFAULT_CHANNEL_SLUGS.safe).toBe('sem-spoilers');
    expect(DEFAULT_CHANNEL_SLUGS.spoilers).toBe('com-spoilers');
  });

  it('validates and builds groupEntryHref correctly', () => {
    const bookId = '550e8400-e29b-41d4-a716-446655440000';
    const chapterId = '550e8400-e29b-41d4-a716-446655440001';

    const parsed = groupEntryContextSchema.safeParse({ livro: bookId, capitulo: chapterId });
    expect(parsed.success).toBe(true);

    const hrefBook = groupEntryHref({ bookId });
    expect(hrefBook).toBe(`/clubes?livro=${bookId}`);

    const hrefCreate = groupEntryHref({ bookId, create: true });
    expect(hrefCreate).toBe(`/clubes/novo?livro=${bookId}`);

    const hrefChapter = groupEntryHref({ bookId, chapterId, create: true });
    expect(hrefChapter).toBe(`/clubes/novo?livro=${bookId}&capitulo=${chapterId}`);
  });

  it('validates openBookDiscussionSchema', () => {
    const valid = openBookDiscussionSchema.safeParse({
      bookId: '550e8400-e29b-41d4-a716-446655440000',
      bookSlug: 'verity',
      destination: 'hub',
    });
    expect(valid.success).toBe(true);

    const invalid = openBookDiscussionSchema.safeParse({
      bookId: 'not-a-uuid',
      bookSlug: 'verity',
    });
    expect(invalid.success).toBe(false);
  });

  it('validates openChapterDiscussionSchema', () => {
    const valid = openChapterDiscussionSchema.safeParse({
      chapterId: '550e8400-e29b-41d4-a716-446655440000',
      videoSec: 120,
    });
    expect(valid.success).toBe(true);

    const invalid = openChapterDiscussionSchema.safeParse({
      chapterId: 'not-a-uuid',
    });
    expect(invalid.success).toBe(false);
  });
});
