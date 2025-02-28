import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Kafka, Consumer, KafkaMessage } from 'kafkajs';
import { ConfigService } from '@nestjs/config';
import e from 'express';
import { KafkaTopics } from './enums/kafka.topics.enum';

@Injectable()
export abstract class KafkaConsumer implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private consumer: Consumer;
  protected readonly logger = new Logger(KafkaConsumer.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly topic: KafkaTopics,
  ) {
    this.kafka = new Kafka({
      brokers: [this.configService.get<string>('KAFKA_BROKER') || 'kafka:9092'],
    });
    this.consumer = this.kafka.consumer({ groupId: 'billing-group' });
  }

  async onModuleInit() {
    try {
      await this.consumer.connect();
      await this.consumer.subscribe({
        topic: this.topic,
        fromBeginning: false,
      });

      await this.consumer.run({
        eachMessage: async ({ message }) => {
          try {
            await this.processMessage(message);
          } catch (error) {
            this.logger.error(
              `Erro ao processar mensagem do tópico ${this.topic}:`,
              error,
            );
          }
        },
      });
    } catch {
      this.logger.error(
        `Erro ao iniciar o consumer do tópico ${this.topic}:`,
        e,
      );
    }
  }
  protected abstract processMessage(message: KafkaMessage): Promise<void>;

  async onModuleDestroy() {
    await this.consumer.disconnect();
    this.logger.log('Kafka Consumer desconectado.');
  }
}
