import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaymentsService } from 'src/modules/payments/payments.service';
import { PaymentsRepository } from 'src/modules/payments/repositories/payments.repository';

@Injectable()
export class PaymentCron {
  private readonly logger = new Logger(PaymentCron.name);
  constructor(
    private readonly paymentService: PaymentsService,
    private readonly paymentRepository: PaymentsRepository,
  ) {}

  @Cron(CronExpression.EVERY_SECOND)
  async retryFailedBoletoGeneration() {
    this.logger.log('Tentando reprocessar boletos com falha...');
    const failedPayments = await this.paymentRepository.getFailedPayments();
    for (const payment of failedPayments) {
      await this.paymentService.generateBankslip(payment.debtId);
    }
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async retryFailedEmails() {
    this.logger.log('Tentando reenviar e-mails de boleto falhados...');
    const pendingEmails = await this.paymentRepository.getPendingEmails();
    for (const payment of pendingEmails) {
      await this.paymentService.sendEmail(payment.debtId);
    }
  }
}
