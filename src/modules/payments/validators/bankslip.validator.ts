import { PaymentEntity } from '../entities/payment.entity';
import { BankslipFieldValidator } from './interface/bankslip-validator.interface';
import { DebtAmountValidator } from './validatorTypes/amout.validator';
import { DueDateValidator } from './validatorTypes/due-date.validator';
import { EmailValidator } from './validatorTypes/email.validator';
import { GovernmentIdValidator } from './validatorTypes/government-id.validator';
import { IdValidator } from './validatorTypes/id.validator';
import { NameValidator } from './validatorTypes/name.validator';

export class BankslipValidator {
  private readonly validators: Record<string, BankslipFieldValidator<any>>;

  constructor() {
    this.validators = {
      name: new NameValidator(),
      debtId: new IdValidator(),
      processingFileId: new IdValidator(),
      email: new EmailValidator(),
      debtAmount: new DebtAmountValidator(),
      dueDate: new DueDateValidator(),
    };
  }

  validate(payment: PaymentEntity): string[] {
    const errors: string[] = [];

    for (const [field, validator] of Object.entries(this.validators)) {
      if (!validator.validate((payment as any)[field])) {
        errors.push(`${field}: ${validator.getErrorMessage()}`);
      }
    }

    return errors;
  }
}