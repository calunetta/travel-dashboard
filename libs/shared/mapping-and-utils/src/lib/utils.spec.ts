import { normalizeDateInput, isValidCalendarDate, calculateNights, isDateInRange, splitFullName, generateFallbackEmail } from './utils';

describe('Date Utilities', () => {
  describe('normalizeDateInput', () => {
    it('should parse dd/MM/yyyy correctly', () => {
      expect(normalizeDateInput('21/02/2027')).toBe('2027-02-21');
      expect(normalizeDateInput('01/12/2024')).toBe('2024-12-01');
    });

    it('should parse dd-MM-yyyy correctly', () => {
      expect(normalizeDateInput('21-02-2027')).toBe('2027-02-21');
    });

    it('should parse YYYYMMDD correctly', () => {
      expect(normalizeDateInput('20270221')).toBe('2027-02-21');
    });

    it('should parse ISO YYYY-MM-DD correctly', () => {
      expect(normalizeDateInput('2027-02-21')).toBe('2027-02-21');
    });

    it('should return null for invalid date formats', () => {
      expect(normalizeDateInput('2027/02/21')).toBeNull(); // not supported
      expect(normalizeDateInput('invalid')).toBeNull();
      expect(normalizeDateInput('2027-21-02')).toBeNull();
    });

    it('should return null for physically invalid dates (e.g. Feb 30)', () => {
      expect(normalizeDateInput('30/02/2027')).toBeNull();
      expect(normalizeDateInput('31/04/2027')).toBeNull();
    });
  });

  describe('isValidCalendarDate', () => {
    it('should validate valid days for given month and year', () => {
      expect(isValidCalendarDate(2027, 2, 28)).toBe(true);
      expect(isValidCalendarDate(2024, 2, 29)).toBe(true); // Leap year
      expect(isValidCalendarDate(2027, 4, 30)).toBe(true);
    });

    it('should reject invalid days', () => {
      expect(isValidCalendarDate(2027, 2, 29)).toBe(false); // Not a leap year
      expect(isValidCalendarDate(2027, 4, 31)).toBe(false);
      expect(isValidCalendarDate(2027, 0, 15)).toBe(false); // Invalid month (0 is not used natively here, we use 1-12)
    });
  });

  describe('calculateNights', () => {
    it('should calculate nights correctly for valid normalized dates', () => {
      expect(calculateNights('2024-01-01', '2024-01-05')).toBe(4);
    });

    it('should fallback to 0 and log warning for unparseable dates instead of crashing', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      expect(calculateNights('2024-01-01', 'invalid')).toBe(0);
      expect(consoleSpy).toHaveBeenCalledWith('[calculateNights] Could not parse date strings: "2024-01-01", "invalid". Returning 0.');
      consoleSpy.mockRestore();
    });

    it('should handle unnormalized but valid string inputs if they pass through parseDateSafe (like dd/MM/yyyy)', () => {
      expect(calculateNights('01/01/2024', '05/01/2024')).toBe(4);
    });
  });

  describe('isDateInRange', () => {
    it('should return true if target is within range', () => {
      expect(isDateInRange('2024-01-03', '2024-01-01', '2024-01-05')).toBe(true);
      expect(isDateInRange('2024-01-01', '2024-01-01', '2024-01-05')).toBe(true);
      expect(isDateInRange('2024-01-05', '2024-01-01', '2024-01-05')).toBe(true);
    });

    it('should return false if target is outside range', () => {
      expect(isDateInRange('2023-12-31', '2024-01-01', '2024-01-05')).toBe(false);
      expect(isDateInRange('2024-01-06', '2024-01-01', '2024-01-05')).toBe(false);
    });

    it('should return false for invalid dates', () => {
      expect(isDateInRange('invalid', '2024-01-01', '2024-01-05')).toBe(false);
    });
  });
  describe('splitFullName', () => {
    it('should extract name and surname correctly', () => {
      expect(splitFullName('Mario Rossi')).toEqual({ name: 'Mario', surname: 'Rossi' });
      expect(splitFullName('Luisa Stefania Rizzi')).toEqual({ name: 'Luisa', surname: 'Stefania Rizzi' });
    });

    it('should handle single names', () => {
      expect(splitFullName('Mario')).toEqual({ name: 'Mario', surname: '' });
    });

    it('should handle empty or null strings', () => {
      expect(splitFullName('')).toEqual({ name: '', surname: '' });
      expect(splitFullName(null as any)).toEqual({ name: '', surname: '' });
    });
  });

  describe('generateFallbackEmail', () => {
    it('should slugify a standard name', () => {
      expect(generateFallbackEmail('Luisa Stefania Rizzi')).toBe('luisa.stefania.rizzi@unknown-coordinator.com');
    });

    it('should handle special characters', () => {
      expect(generateFallbackEmail('Mario O\'Connor-Smith!')).toBe('mario.oconnorsmith@unknown-coordinator.com');
    });

    it('should handle empty or null strings', () => {
      expect(generateFallbackEmail('')).toBe('unknown@unknown-coordinator.com');
      expect(generateFallbackEmail(null as any)).toBe('unknown@unknown-coordinator.com');
    });
  });
});
