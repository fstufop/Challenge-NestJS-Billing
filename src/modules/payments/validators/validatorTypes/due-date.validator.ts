import { BaseFieldValidator } from '../interface/bankslip-validator.interface';

export class DueDateValidator extends BaseFieldValidator<Date> {
  validate(value: Date): boolean {
    if (!(value instanceof Date) || isNaN(value.getTime())) {
      this.errorMessage = 'Data de vencimento inválida.';
      return false;
    }

    const today = new Date();
    if (value < today) {
      this.errorMessage = 'A data de vencimento não pode estar no passado.';
      return false;
    }

    return true;
  }
}
