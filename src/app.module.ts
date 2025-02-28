import { Module } from '@nestjs/common';
import { FileApiModule } from './modules/file-api/file-api.module';
import { FileProcessingModule } from './modules/file-processing/file-processing.module';
import { PaymentsModule } from './modules/payments/payments.module';

@Module({
  imports: [FileApiModule, FileProcessingModule, PaymentsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
