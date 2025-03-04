import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaMessage } from 'kafkajs';
import { KafkaTopics } from 'src/shared/kafka/enums/kafka.topics.enum';
import { KafkaConsumer } from 'src/shared/kafka/kafka.consumer';

@Injectable()
export class PaymentsConsumer extends KafkaConsumer {
  constructor(configService: ConfigService) {
    super(configService, KafkaTopics.processedLines, 'payment');
  }

  protected async processMessage(message: KafkaMessage) {
    console.log(`Processando arquivo recebido:`);
  }
}
