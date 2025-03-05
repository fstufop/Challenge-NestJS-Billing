import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as cron from 'node-cron';
import { PaymentsService } from 'src/modules/payments/payments.service';
import { PaymentsRepository } from 'src/modules/payments/repositories/payments.repository';

@Injectable()
export class PaymentCron implements OnModuleInit {
  private readonly logger = new Logger(PaymentCron.name);

  constructor(
    private readonly paymentService: PaymentsService,
    private readonly paymentRepository: PaymentsRepository,
  ) {}

  onModuleInit() {
    this.scheduleRetryFailedBoletoGeneration();
    this.scheduleRetryFailedEmails();
  }

  private scheduleRetryFailedBoletoGeneration() {
    cron.schedule('*/5 * * * *', async () => {
      this.logger.log('⏳ Tentando reprocessar boletos com falha...');
      const failedPayments = await this.paymentRepository.getFailedPayments();
      for (const payment of failedPayments) {
        await this.paymentService.generateBankslip(payment.debtId);
      }
    });
  }

  private scheduleRetryFailedEmails() {
    cron.schedule('*/5 * * * *', async () => {
      this.logger.log('📩 Tentando reenviar e-mails de boleto falhados...');
      const pendingEmails = await this.paymentRepository.getPendingEmails();
      for (const payment of pendingEmails) {
        await this.paymentService.sendEmail(payment.debtId);
      }
    });
  }
}