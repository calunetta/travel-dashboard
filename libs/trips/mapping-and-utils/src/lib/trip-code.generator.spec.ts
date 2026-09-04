import { TripCodeGenerator } from './trip-code.generator';

describe('TripCodeGenerator', () => {
  it('should generate code with -A suffix when no existing codes match', () => {
    const code = TripCodeGenerator.generateCode('IT-WX-MDV', '2026-09-06', []);
    expect(code).toBe('IT-WX-MDV-20260906-A');
  });

  it('should generate code with next letter if one matching code exists', () => {
    const existing = ['IT-WX-MDV-20260906-A'];
    const code = TripCodeGenerator.generateCode('IT-WX-MDV', '2026-09-06', existing);
    expect(code).toBe('IT-WX-MDV-20260906-B');
  });

  it('should generate code with -C suffix when -A and -B exist', () => {
    const existing = ['IT-WX-MDV-20260906-A', 'IT-WX-MDV-20260906-B'];
    const code = TripCodeGenerator.generateCode('IT-WX-MDV', '2026-09-06', existing);
    expect(code).toBe('IT-WX-MDV-20260906-C');
  });

  it('should ignore unrelated codes', () => {
    const existing = ['IT-WX-MDV-20260906-A', 'OTHER-20260906-B'];
    const code = TripCodeGenerator.generateCode('IT-WX-MDV', '2026-09-06', existing);
    expect(code).toBe('IT-WX-MDV-20260906-B');
  });

  it('should ignore codes with different dates', () => {
    const existing = ['IT-WX-MDV-20260907-A'];
    const code = TripCodeGenerator.generateCode('IT-WX-MDV', '2026-09-06', existing);
    expect(code).toBe('IT-WX-MDV-20260906-A');
  });

  it('should ignore codes with different base codes', () => {
    const existing = ['FR-WX-MDV-20260906-A'];
    const code = TripCodeGenerator.generateCode('IT-WX-MDV', '2026-09-06', existing);
    expect(code).toBe('IT-WX-MDV-20260906-A');
  });

  it('should find the highest char code and increment', () => {
    const existing = [
      'IT-WX-MDV-20260906-A',
      'IT-WX-MDV-20260906-C', // missing B
      'IT-WX-MDV-20260906-B',
    ];
    const code = TripCodeGenerator.generateCode('IT-WX-MDV', '2026-09-06', existing);
    expect(code).toBe('IT-WX-MDV-20260906-D');
  });

  it('should handle dates with hyphens correctly', () => {
    const code = TripCodeGenerator.generateCode('BASE', '2026-12-31', []);
    expect(code).toBe('BASE-20261231-A');
  });
});
