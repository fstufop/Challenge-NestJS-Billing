import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class BankslipGeneratorProvider {
  private readonly logger = new Logger(BankslipGeneratorProvider.name);

  async generateBankslip(): Promise<string> {
    this.logger.log('Gerando boleto...');

    const barcode = this.generateRandomBarcode();
    
    await new Promise((resolve) => setTimeout(resolve, 500));

    this.logger.log(`Código de barras gerado: ${barcode}`);
    return barcode;
  }

  private generateRandomBarcode(): string {
    return Array.from({ length: 48 }, () => Math.floor(Math.random() * 10)).join('');
  }
}