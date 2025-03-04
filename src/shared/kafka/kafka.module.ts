import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { FileProcessingProducer } from 'src/modules/file-processing/kafka/file-proccessing.producer';
import { FileProcessingConsumer } from 'src/modules/file-processing/kafka/file-proccessing.consumer';
import { FileApiProducer } from 'src/modules/file-api/kafka/file-api.producer';
import { PaymentsConsumer } from 'src/modules/payments/kafka/file-proccessing.consumer';
import { FileProcessingService } from 'src/modules/file-processing/file-processing.service';
import { S3Service } from '../storage/s3.service';
import { ProcessedLineRepository } from 'src/modules/file-processing/repositories/processed-line-repository';
import { ProcessingFilesRepository } from 'src/modules/file-processing/repositories/processing-files-repository';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'file-processing',
            brokers: ['kafka:9092'],
          },
          consumer: {
            groupId: 'billing-group',
          },
        },
      },
    ]),
  ],
  controllers: [],
  providers: [
    FileProcessingProducer,
    FileProcessingConsumer,
    FileApiProducer,
    PaymentsConsumer,
    FileProcessingService,
    ProcessedLineRepository,
    ProcessingFilesRepository,
    S3Service,
  ],
  exports: [
    FileProcessingProducer,
    FileProcessingConsumer,
    FileApiProducer,
    PaymentsConsumer,
  ],
})
export class KafkaModule {}
