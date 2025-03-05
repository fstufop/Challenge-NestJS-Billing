import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, Consumer, KafkaMessage, EachBatchPayload } from 'kafkajs';
import { ConfigService } from '@nestjs/config';
import { KafkaTopics } from './enums/kafka.topics.enum';

@Injectable()
export abstract class KafkaConsumer implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private consumer: Consumer;
  protected readonly logger = new Logger(KafkaConsumer.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly topic: KafkaTopics,
    private readonly groupId: string,
  ) {
    this.kafka = new Kafka({
      brokers: [this.configService.get<string>('KAFKA_BROKER') || 'kafka:9092'],
    });

    this.consumer = this.kafka.consumer({
      groupId,
    });
  }

  async onModuleInit() {
    try {
      await this.consumer.connect();
      await this.consumer.subscribe({
        topic: this.topic,
        fromBeginning: false,
      });

      await this.consumer.run({
        eachBatch: async (batch) => {
          try {
            await this.processBatch(batch);
          } catch (error) {
            this.logger.error(`Erro ao processar batch do tópico ${this.topic}:`, error);
          }
        },
      });
    } catch (error) {
      this.logger.error(`Erro ao iniciar o consumer do tópico ${this.topic}:`, error);
    }
  }

  protected async processBatch(batch: EachBatchPayload): Promise<void> {
    const { batch: kafkaBatch, resolveOffset, heartbeat } = batch;
    for (const message of kafkaBatch.messages) {
      try {
        await this.processMessage(message);
        resolveOffset(message.offset); 
      } catch (error) {
        this.logger.error(`Erro ao processar mensagem do Kafka: ${error.message}`);
      }
    }
    await heartbeat(); 
  }

  protected abstract processMessage(message: KafkaMessage): Promise<void>;

  async onModuleDestroy() {
    await this.consumer.disconnect();
    this.logger.log('Kafka Consumer desconectado.');
  }
}