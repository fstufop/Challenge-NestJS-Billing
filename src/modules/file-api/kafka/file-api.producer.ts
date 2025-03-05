import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileUploadedMessageDto } from '../../../shared/kafka/dtos/file-uploaded-message.dto';
import { KafkaTopics } from '../../../shared/kafka/enums/kafka.topics.enum';
import { KafkaProducer } from '../../../shared/kafka/kafka.producer';

@Injectable()
export class FileApiProducer extends KafkaProducer {
  constructor(configService: ConfigService) {
    super(configService);
  }

  async notifyFileUploaded(file: FileUploadedMessageDto) {
    await this.sendMessage(KafkaTopics.fileUploaded, file);
  }
}