import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Kafka, Producer, Message } from 'kafkajs';
import { ConfigService } from '@nestjs/config';
import { KafkaTopics } from './enums/kafka.topics.enum';

@Injectable()
export abstract class KafkaProducer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducer.name);
  private kafka: Kafka;
  private producer: Producer;
  private readonly batchSize = 1000; 
  private readonly concurrency = 10; 

  constructor(private readonly configService: ConfigService) {
    this.kafka = new Kafka({
      brokers: [this.configService.get<string>('KAFKA_BROKER') || 'localhost:9092'],
    });

    this.producer = this.kafka.producer({
      allowAutoTopicCreation: true, 
      maxInFlightRequests: this.concurrency,
      transactionTimeout: 30000,
    });
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
      this.logger.log(`Mensagem enviada para o tópico ${topic}`);
    } catch (error) {
      this.logger.error(`Erro ao enviar mensagem para o tópico ${topic}: ${error.message}`);
    }
  }

  async sendBatchProcessedLines(topic: KafkaTopics, messages: { key: string; value: string }[]) {
    if (!messages.length) return;

    try {
      const batches = this.splitIntoBatches(messages, this.batchSize);
      const batchPromises = batches.map(batch => this.sendBatch(topic, batch));

      await Promise.all(batchPromises);
    } catch (error) {
      this.logger.error(`Erro ao enviar batch de mensagens para Kafka: ${error.message}`);
    }
  }

  private async sendBatch(topic: string, batch: { key: string; value: string }[]) {
    try {
      await this.producer.send({
        topic,
        messages: batch.map(msg => ({
          key: msg.key,
          value: msg.value,
        })),
        acks: 1,
      });
      this.logger.log(`Batch de ${batch.length} mensagens enviado com sucesso.`);
    } catch (error) {
      this.logger.error(`Erro ao enviar batch para Kafka: ${error.message}`);
    }
  }

  private splitIntoBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    this.logger.log('Kafka Producer desconectado.');
  }
}