import { Injectable, Logger } from '@nestjs/common';
import { PaymentsRepository } from './repositories/payments.repository';
import { BankslipGeneratorProvider } from './providers/bankslip-generator.provider';
import { EmailProvider } from './providers/email-provider';
import { PaymentEntity, PaymentStatus } from './entities/payment.entity';
import { BankslipValidator } from './validators/bankslip.validator';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly bankslipGenerator: BankslipGeneratorProvider,
    private readonly emailProvider: EmailProvider,
    private readonly bankslipValidator: BankslipValidator,
  ) {}

  async processPaymentMessage(data: any) {
    this.logger.log(`📥 Recebendo pagamento para processamento: ${data.debtId}`);

    let rawData;
    try {
      rawData =
        typeof data.rawData === 'string'
          ? JSON.parse(data.rawData)
          : data.rawData;
    } catch (error) {
      this.logger.error(`Erro ao parsear rawData: ${error.message}`);
      return;
    }

    if (!rawData || !rawData.debtId) {
      this.logger.warn(`Dados inválidos na mensagem Kafka: ${JSON.stringify(data)}`);
      return;
    }

    const existingPayment = await this.paymentsRepository.findByDebtId(rawData.debtId);

    if (!existingPayment) {
      const newPayment: PaymentEntity = {
        debtId: rawData.debtId,
        name: rawData.name,
        email: rawData.email,
        governmentId: rawData.governmentId,
        debtAmount: parseFloat(rawData.debtAmount),
        dueDate: new Date(rawData.debtDueDate),
        processingFileId: data.fileId,
        status: PaymentStatus.PENDING,
        generateRetries: 0,
        sendRetries: 0,
        errorMessage: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.paymentsRepository.createPayment(newPayment);
      this.logger.log(`Novo pagamento registrado: ${rawData.debtId}`);
      const validationErrors = this.bankslipValidator.validate(newPayment);
      if (validationErrors.length > 0) {
        this.logger.error(`Erros de validação: ${validationErrors.join(', ')}`);
        await this.paymentsRepository.updateValidationError(
          rawData.debtId,
          validationErrors.join('; '),
        );
        return;
      }
    }

    await this.generateBankslip(rawData.debtId);
  }

  async generateBankslip(debtId: string) {
    this.logger.log(`Atualizando status para PROCESSING para o boleto ${debtId}`);
    await this.paymentsRepository.updateStatus(debtId, PaymentStatus.PROCESSING);

    try {
      const barcode = await this.bankslipGenerator.generateBankslip();
      await this.paymentsRepository.updateBarcode(debtId, barcode);
      this.logger.log(`Boleto gerado com sucesso para ${debtId}: ${barcode}`);

      await this.sendEmail(debtId);
    } catch (error) {
      this.logger.error(`Erro na geração do boleto para ${debtId}: ${error.message}`);
      await this.paymentsRepository.updateStatus(debtId, PaymentStatus.GENERATE_FAILED);
    }
  }

  async sendEmail(debtId: string) {
    const payment = await this.paymentsRepository.findByDebtId(debtId);
    if (!payment) {
      this.logger.warn(`Tentativa de envio de e-mail para pagamento inexistente: ${debtId}`);
      return;
    }

    try {
      const success = await this.emailProvider.sendBankslipEmail(payment.email);
      if (success) {
        await this.paymentsRepository.updateStatus(debtId, PaymentStatus.SENT);
        this.logger.log(`E-mail enviado com sucesso para ${payment.email}`);
      } else {
        await this.paymentsRepository.updateStatus(debtId, PaymentStatus.SEND_FAILED);
        this.logger.warn(`Falha no envio do e-mail para ${payment.email}`);
      }
    } catch (error) {
      this.logger.error(`Erro no envio de e-mail para ${payment.email}: ${error.message}`);
      await this.paymentsRepository.updateStatus(debtId, PaymentStatus.SEND_FAILED);
    }
  }
}