import { describe, it, expect } from 'vitest';
import { verifyAuth } from './auth';

describe('verifyAuth', () => {
  it('returns null if no token', async () => {
    const req = { headers: { get: () => null }, cookies: { get: () => null } };
    // @ts-expect-error: test expects error for this line
    const result = await verifyAuth(req);
    expect(result).toBeNull();
  });
});
