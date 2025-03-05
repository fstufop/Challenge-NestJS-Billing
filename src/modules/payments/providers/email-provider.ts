import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailProvider {
  private readonly logger = new Logger(EmailProvider.name);

  async sendBankslipEmail(email: string): Promise<boolean> {
    this.logger.log(`Enviando boleto para o email: ${email}...`);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      this.logger.log(`E-mail enviado com sucesso para: ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Falha ao enviar e-mail para ${email}: ${error.message}`);
      return false;
    }
  }
}