export class TripCodeGenerator {
  /**
   * Generates a trip code in the format: {tourWeRoadCode}-{startDateYYYYMMDD}-{Letter}
   * The letter increments (A, B, C...) based on existing tours for the same base code.
   * 
   * @param tourWeRoadCode The base WeRoad code (e.g. IT-WX-MDV-MBX-WX-AY)
   * @param startDate ISO date string (e.g. 2026-09-06)
   * @param existingCodes Array of existing full codes to determine the next letter
   * @returns The generated tour code
   */
  static generateCode(tourWeRoadCode: string, startDate: string, existingCodes: string[]): string {
    const formattedDate = startDate.replace(/-/g, '');
    const baseCode = `${tourWeRoadCode}-${formattedDate}`;
    
    // Find all existing codes that start with the base code
    const matchingCodes = existingCodes.filter(c => c.startsWith(baseCode + '-'));
    
    if (matchingCodes.length === 0) {
      return `${baseCode}-A`;
    }
    
    // Extract suffixes
    const suffixes = matchingCodes.map(c => c.split('-').pop() || 'A');
    
    // Find highest char code
    let maxCharCode = 64; // ASCII before 'A'
    for (const suffix of suffixes) {
      if (suffix.length === 1) {
        const code = suffix.charCodeAt(0);
        if (code > maxCharCode) {
          maxCharCode = code;
        }
      }
    }
    
    const nextLetter = String.fromCharCode(maxCharCode + 1);
    return `${baseCode}-${nextLetter}`;
  }
}
