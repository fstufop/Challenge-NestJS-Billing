import { Module } from '@nestjs/common';
import { FileApiModule } from './modules/file-api/file-api.module';
import { FileProcessingModule } from './modules/file-processing/file-processing.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { DatabaseModule } from './shared/database/database.module';
import { KafkaModule } from './shared/kafka/kafka.module';
import { FileApiProducer } from './modules/file-api/kafka/file-api.producer';
import { FileProcessingProducer } from './modules/file-processing/kafka/file-proccessing.producer';
import { FileProcessingConsumer } from './modules/file-processing/kafka/file-proccessing.consumer';
import { PaymentsConsumer } from './modules/payments/kafka/payment.consumer';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    FileApiModule,
    FileProcessingModule,
    PaymentsModule,
    DatabaseModule,
    KafkaModule,
  ],
  controllers: [],
  providers: [
    FileApiProducer,
    FileProcessingProducer,
    FileProcessingConsumer,
    PaymentsConsumer,
  ],
})
export class AppModule {}
