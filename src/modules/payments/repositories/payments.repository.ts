import { DataSource, Repository } from 'typeorm';
import { PaymentEntity, PaymentStatus } from '../entities/payment.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentsRepository extends Repository<PaymentEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(PaymentEntity, dataSource.createEntityManager());
  }

  async findByDebtId(debtId: string): Promise<PaymentEntity | null> {
    return this.findOne({ where: { debtId } });
  }

  async createPayment(payment: Partial<PaymentEntity>): Promise<PaymentEntity> {
    return this.save(payment);
  }

  async updateStatus(debtId: string, status: PaymentStatus) {
    return this.update({ debtId }, { status });
  }

  async updateBarcode(debtId: string, barcode: string) {
    return this.update(
      { debtId },
      { barcode, status: PaymentStatus.GENERATED },
    );
  }

  async incrementRetries(
    debtId: string,
    retryField: 'generate_retries' | 'send_retries',
  ) {
    await this.increment({ debtId }, retryField, 1);
  }

  async getFailedPayments(): Promise<PaymentEntity[]> {
    return this.find({ where: { status: PaymentStatus.GENERATE_FAILED } });
  }

  async getPendingEmails(): Promise<PaymentEntity[]> {
    return this.find({ where: { status: PaymentStatus.SEND_FAILED } });
  }

  async updateValidationError(debtId: string, errorMessage: string) {
    return this.update(
      { debtId },
      { status: PaymentStatus.VALIDATION_ERROR, errorMessage },
    );
  }
}
