import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn utility', () => {
  it('merges class names correctly', () => {
    const result = cn('px-4', 'py-2');
    expect(result).toBe('px-4 py-2');
  });

  it('handles conditional classes', () => {
    const result = cn('base', { 'conditional': true, 'not-applied': false });
    expect(result).toBe('base conditional');
  });

  it('handles undefined and null values', () => {
    const result = cn('base', undefined, null, 'end');
    expect(result).toBe('base end');
  });

  it('merges Tailwind classes correctly', () => {
    const result = cn('px-4 py-2', 'px-6');
    expect(result).toBe('py-2 px-6');
  });

  it('handles empty input', () => {
    const result = cn();
    expect(result).toBe('');
  });
});
