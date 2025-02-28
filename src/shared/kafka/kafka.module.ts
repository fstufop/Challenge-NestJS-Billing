import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { FileProcessingProducer } from 'src/modules/file-processing/kafka/file-proccessing.producer';
import { FileProcessingConsumer } from 'src/modules/file-processing/kafka/file-proccessing.consumer';
import { FileApiProducer } from 'src/modules/file-api/kafka/file-api.producer';
import { PaymentsConsumer } from 'src/modules/payments/kafka/file-proccessing.consumer';

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
            sessionTimeout: 30000,
            heartbeatInterval: 5000,
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
  ],
  exports: [
    FileProcessingProducer,
    FileProcessingConsumer,
    FileApiProducer,
    PaymentsConsumer,
  ],
})
export class KafkaModule {}
