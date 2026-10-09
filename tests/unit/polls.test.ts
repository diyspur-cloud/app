import { describe, expect, it } from 'vitest';
import { parsePollVoteInput } from '../../src/features/polls/schemas';

const pollId = '11111111-1111-4111-8111-111111111111';
const optionId = '22222222-2222-4222-8222-222222222222';

describe('poll vote input', () => {
  it('accepts only the poll and option UUIDs', () => {
    expect(parsePollVoteInput({ pollId, optionId })).toEqual({
      success: true,
      data: { pollId, optionId },
    });
  });

  it('rejects non-UUID identifiers', () => {
    const parsed = parsePollVoteInput({ pollId: 'poll-1', optionId });
    expect(parsed.success).toBe(false);
  });

  it('rejects client-supplied identity and counters', () => {
    const parsed = parsePollVoteInput({
      pollId,
      optionId,
      user_id: '33333333-3333-4333-8333-333333333333',
      votes_count: 99,
    });
    expect(parsed.success).toBe(false);
  });
});
