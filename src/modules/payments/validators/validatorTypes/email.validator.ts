import { BaseFieldValidator } from '../interface/bankslip-validator.interface';

export class EmailValidator extends BaseFieldValidator<string> {
  validate(value: string): boolean {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      this.errorMessage = 'E-mail inválido.';
      return false;
    }
    return true;
  }
}
