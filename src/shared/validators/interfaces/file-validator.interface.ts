export abstract class FileValidator {
  abstract validateLine(line: any): { isValid: boolean; errors: string[] };
}