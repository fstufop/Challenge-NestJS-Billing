import { BaseFieldValidator } from '../interface/bankslip-validator.interface';

export class GovernmentIdValidator extends BaseFieldValidator<string> {
  validate(value: string): boolean {
    if (!/^\d{11}$|^\d{14}$/.test(value)) {
      this.errorMessage =
        'Documento inválido. Deve ser um CPF (11 dígitos) ou CNPJ (14 dígitos).';
      return false;
    }
    return true;
  }
}
