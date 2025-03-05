import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaMessage, EachBatchPayload } from 'kafkajs';
import { KafkaTopics } from '../../../shared/kafka/enums/kafka.topics.enum';
import { KafkaConsumer } from '../../../shared/kafka/kafka.consumer';
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

  protected async processBatch(batch: EachBatchPayload) {
    const { batch: kafkaBatch, resolveOffset, heartbeat } = batch;
    const messages = kafkaBatch.messages;
    
    if (!messages.length) return;

    const parsedMessages = messages
      .map((message) => this.parseKafkaMessage(message))
      .filter((msg) => msg !== null);

    if (parsedMessages.length > 0) {
      this.logger.log(`Processando batch de ${parsedMessages.length} pagamentos`);

      await Promise.all(
        parsedMessages.map(async (msg, index) => {
          try {
            await this.paymentService.processPaymentMessage(msg);
            resolveOffset(messages[index].offset);
          } catch (error) {
            this.logger.error(`Erro ao processar pagamento: ${error.message}`);
          }
        }),
      );
    }

    await heartbeat();
  }

  private parseKafkaMessage(message: KafkaMessage): any | null {
    try {
      const parsedValue = JSON.parse(
        Buffer.from(message.value as Buffer).toString('utf-8'),
      );

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