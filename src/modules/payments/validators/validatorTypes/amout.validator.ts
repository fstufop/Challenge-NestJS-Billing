import { BaseFieldValidator } from '../interface/bankslip-validator.interface';

export class DebtAmountValidator extends BaseFieldValidator<number> {
  validate(value: number): boolean {
    if (isNaN(value) || value <= 0) {
      this.errorMessage = 'Valor da dívida deve ser maior que zero.';
      return false;
    }
    return true;
  }
}
