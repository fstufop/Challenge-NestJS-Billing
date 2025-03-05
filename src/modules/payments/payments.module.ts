import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentEntity } from './entities/payment.entity';
import { PaymentsRepository } from './repositories/payments.repository';
import { BankslipGeneratorProvider } from 'src/modules/payments/providers/bankslip-generator.provider';
import { EmailProvider } from 'src/modules/payments/providers/email-provider';
import { BankslipValidator } from './validators/bankslip.validator';
import { PaymentCron } from './jobs/payments-retry.jobs';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentEntity, PaymentsRepository])],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    BankslipGeneratorProvider,
    EmailProvider,
    PaymentsRepository,
    BankslipValidator,
    PaymentCron,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
