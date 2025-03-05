import { validate as isUuid } from 'uuid';
import { BaseFieldValidator } from '../interface/bankslip-validator.interface';

export class IdValidator extends BaseFieldValidator<string> {
  validate(value: string): boolean {
    if (!isUuid(value)) {
      this.errorMessage = 'UUID inválido.';
      return false;
    }
    return true;
  }
}
