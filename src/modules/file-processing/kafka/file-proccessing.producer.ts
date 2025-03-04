import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProcessedLineMessageDto } from 'src/shared/kafka/dtos/processed-line-message.dto';
import { KafkaTopics } from 'src/shared/kafka/enums/kafka.topics.enum';
import { KafkaProducer } from 'src/shared/kafka/kafka.producer';

@Injectable()
export class FileProcessingProducer extends KafkaProducer {
  constructor(configService: ConfigService) {
    super(configService);
  }

  async sendBatchProcessedLine(line: any[]) {
    await this.sendBatchProcessedLines(KafkaTopics.processedLines, line);
  }
}