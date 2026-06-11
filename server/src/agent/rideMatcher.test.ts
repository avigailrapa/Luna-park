import { describe, expect, it } from 'vitest';
import { normalize } from './rideMatcher';

describe('rideMatcher', () => {
  it('normalizes whitespace and casing', () => {
    expect(normalize('  גלגל   הענק  ')).toBe('גלגל הענק');
    expect(normalize('Roller Coaster')).toBe('roller coaster');
  });

  it('handles empty input', () => {
    expect(normalize('')).toBe('');
    expect(normalize(null as unknown as string)).toBe('');
  });
});
