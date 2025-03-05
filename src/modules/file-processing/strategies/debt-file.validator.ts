import { Injectable } from '@nestjs/common';
import { FileValidator } from './file-validator.interface';

@Injectable()
export class DebtFileValidator implements FileValidator {
  validateLine(row: any) {
    const errors: string[] = [];

    if (!row.name) errors.push('Nome ausente');
    if (!row.governmentId) errors.push('Número do documento ausente');
    if (!row.email || !this.isValidEmail(row.email))
      errors.push('Email inválido');
    if (!row.debtAmount || parseFloat(row.debtAmount) <= 0)
      errors.push('Valor do débito inválido');
    if (!row.debtDueDate || isNaN(Date.parse(row.debtDueDate)))
      errors.push('Data do débito inválida');
    if (!row.debtId) errors.push('UUID do débito ausente');

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
