import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaMessage } from 'kafkajs';
import { KafkaTopics } from 'src/shared/kafka/enums/kafka.topics.enum';
import { KafkaConsumer } from 'src/shared/kafka/kafka.consumer';
import { PaymentsService } from '../payments.service';

@Injectable()
export class PaymentsConsumer extends KafkaConsumer {
  constructor(
    configService: ConfigService,
    private readonly paymentService: PaymentsService,
  ) {
    super(configService, KafkaTopics.processedLines, 'payment');
  }

  protected async processMessage(message: KafkaMessage) {
    const parsedMessage = this.parseKafkaMessage(message);

    if (parsedMessage) {
      await this.paymentService.processPaymentMessage(parsedMessage);
    }
  }

  private parseKafkaMessage(message: KafkaMessage): any | null {
    try {
      const parsedValue = JSON.parse(Buffer.from(message.value as Buffer).toString('utf-8'));

      if (typeof parsedValue.rawData === 'string') {
        parsedValue.rawData = JSON.parse(parsedValue.rawData);
      }

      return parsedValue;
    } catch (error) {
      this.logger.error(`Erro ao decodificar mensagem Kafka: ${error.message}`);
      return null;
    }
  }
}
