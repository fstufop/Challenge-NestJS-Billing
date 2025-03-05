export interface BankslipFieldValidator<T> {
    validate(value: T): boolean;
    getErrorMessage(): string;
  }

  export abstract class BaseFieldValidator<T> implements BankslipFieldValidator<T> {
    protected errorMessage: string = '';
  
    abstract validate(value: T): boolean;
  
    getErrorMessage(): string {
      return this.errorMessage;
    }
  }