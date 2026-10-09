import { describe, expect, it } from 'vitest';
import { commentSchema, progressSchema } from '../../src/features/chapters/schemas';

const chapterId = '7b4c0dd1-f73a-4db4-9ab7-8a79f2ad4533';

describe('chapter write contracts', () => {
  it('accepts a trimmed comment and spoiler threshold within 0..100', () => {
    const result = commentSchema.safeParse({ chapterId, content: '  Minha leitura  ', isSpoiler: true, minPercent: 75 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.content).toBe('Minha leitura');
  });

  it('rejects empty, oversized and invalid spoiler-threshold comments', () => {
    expect(commentSchema.safeParse({ chapterId, content: ' ', isSpoiler: false }).success).toBe(false);
    expect(commentSchema.safeParse({ chapterId, content: 'x'.repeat(4001), isSpoiler: false }).success).toBe(false);
    expect(commentSchema.safeParse({ chapterId, content: 'ok', isSpoiler: true, minPercent: 101 }).success).toBe(false);
  });

  it('accepts only the supported progress statuses and ignores client identity', () => {
    const result = progressSchema.safeParse({ chapterId, status: 'read', user_id: 'attacker' });
    expect(result.success).toBe(true);
    if (result.success) expect('user_id' in result.data).toBe(false);
    expect(progressSchema.safeParse({ chapterId, status: 'admin' }).success).toBe(false);
  });
});
