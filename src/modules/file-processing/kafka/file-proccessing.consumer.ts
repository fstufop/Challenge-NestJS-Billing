import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaMessage } from 'kafkajs';
import { KafkaTopics } from '../../../shared/kafka/enums/kafka.topics.enum';
import { KafkaConsumer } from '../../../shared/kafka/kafka.consumer';
import { FileProcessingService } from '../file-processing.service';

@Injectable()
export class FileProcessingConsumer extends KafkaConsumer {
  constructor(
    configService: ConfigService,
    private readonly fileProcessingService: FileProcessingService
  ) {
    super(configService, KafkaTopics.fileUploaded, 'file-processing');
  }

  protected async processMessage(message: KafkaMessage) {
    const messageContent = message.value;
    if (messageContent) {
      const fileInfo = JSON.parse(messageContent.toString());
      this.fileProcessingService.processMessage(fileInfo)
    } else {
      this.logger.debug("Mesagem recebida sem conteúdo")
    }
  }
}
