import { Injectable, Inject } from '@nestjs/common';
import { DebtFileValidator } from './debt-file.validator';
import { FileValidator } from './file-validator.interface';
import { FileType } from 'src/modules/file-processing/strategies/file-validator.enum';

@Injectable()
export class FileValidatorFactory {
  constructor(
    @Inject(DebtFileValidator)
    private readonly debtValidator: DebtFileValidator,
  ) {}

  getValidator(fileType: FileType): FileValidator {
    switch (fileType) {
      case FileType.DEBT:
        return this.debtValidator;
      default:
        throw new Error(
          `Nenhuma validação definida para o tipo de arquivo: ${fileType}`,
        );
    }
  }
}
