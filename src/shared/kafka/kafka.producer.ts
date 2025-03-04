import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Kafka, Message, Producer } from 'kafkajs';
import { ConfigService } from '@nestjs/config';
import { KafkaTopics } from './enums/kafka.topics.enum';

@Injectable()
export abstract class KafkaProducer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducer.name);
  private kafka: Kafka;
  private producer: Producer;

  constructor(private readonly configService: ConfigService) {
    this.kafka = new Kafka({
      brokers: [this.configService.get<string>('KAFKA_BROKER') || 'kafka:9092'],
    });
    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    await this.producer.connect();
    this.logger.log('Kafka Producer conectado.');
  }

  async sendMessage<T>(topic: KafkaTopics, message: T) {
    try {
      await this.producer.send({
        topic,
        messages: [{ value: JSON.stringify(message) }],
      });
      // this.logger.log(`Mensagem enviada para o tópico ${topic}`);
    } catch (error) {
      this.logger.error(
        `Erro ao enviar mensagem para o tópico ${topic}:`,
        error,
      );
    }
  }

  async sendBatchProcessedLines(
    topic: KafkaTopics,
    messages: { key: string; value: string }[],
  ) {
    if (!messages.length) return;

    try {
      const batchMessages: Message[] = messages.map((msg) => ({
        key: msg.key,
        value: msg.value,
      }));

      await this.producer.send({
        topic,
        messages: batchMessages,
      });

      this.logger.log(
        `✅ Enviadas ${messages.length} mensagens para o tópico ${topic}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Erro ao enviar mensagens para Kafka: ${error.message}`,
      );
    }
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    this.logger.log('Kafka Producer desconectado.');
  }
}
