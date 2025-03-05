import { BaseFieldValidator } from '../interface/bankslip-validator.interface';

export class NameValidator extends BaseFieldValidator<string> {
  validate(value: string): boolean {
    if (!value || value.trim().length < 3) {
      this.errorMessage = 'Nome inválido. Deve ter pelo menos 3 caracteres.';
      return false;
    }
    return true;
  }
}
