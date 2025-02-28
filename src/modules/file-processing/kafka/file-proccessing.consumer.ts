import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaMessage } from 'kafkajs';
import { KafkaTopics } from 'src/shared/kafka/enums/kafka.topics.enum';
import { KafkaConsumer } from 'src/shared/kafka/kafka.consumer';

@Injectable()
export class FileProcessingConsumer extends KafkaConsumer {
  constructor(configService: ConfigService) {
    super(configService, KafkaTopics.fileUploaded);
  }

  protected async processMessage(message: KafkaMessage) {
    console.log(`Processando arquivo recebido:`, message);
  }
}
