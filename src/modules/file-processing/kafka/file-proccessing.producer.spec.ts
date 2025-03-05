import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { KafkaProducer } from '../../../shared/kafka/kafka.producer';
import { KafkaTopics } from '../../../shared/kafka/enums/kafka.topics.enum';
import { FileProcessingProducer } from './file-proccessing.producer';

jest.mock('../../../shared/kafka/kafka.producer');

describe('FileProcessingProducer', () => {
  let fileProcessingProducer: FileProcessingProducer;
  let kafkaProducerMock: jest.Mocked<KafkaProducer>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileProcessingProducer,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('localhost:9092'),
          },
        },
        {
          provide: KafkaProducer,
          useValue: {
            sendBatchProcessedLines: jest.fn(),
          },
        },
      ],
    }).compile();

    fileProcessingProducer = module.get<FileProcessingProducer>(FileProcessingProducer);
    kafkaProducerMock = module.get<KafkaProducer>(KafkaProducer) as jest.Mocked<KafkaProducer>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendBatchProcessedLine', () => {
    it('should call sendBatchProcessedLines with the correct topic and messages', async () => {
      const messages = [
        { key: 'key1', value: 'value1' },
        { key: 'key2', value: 'value2' },
      ];

      jest.spyOn(fileProcessingProducer, 'sendBatchProcessedLines').mockResolvedValue(undefined);

      await fileProcessingProducer.sendBatchProcessedLine(messages);

      expect(fileProcessingProducer.sendBatchProcessedLines).toHaveBeenCalledWith(
        KafkaTopics.processedLines,
        messages,
      );
    });

    it('should handle empty message batch gracefully', async () => {
      jest.spyOn(fileProcessingProducer, 'sendBatchProcessedLines').mockResolvedValue(undefined);

      await fileProcessingProducer.sendBatchProcessedLine([]);

      expect(fileProcessingProducer.sendBatchProcessedLines).toHaveBeenCalledTimes(1);
      expect(fileProcessingProducer.sendBatchProcessedLines).toHaveBeenCalledWith(KafkaTopics.processedLines, []);
    });

    it('should log an error if sendBatchProcessedLines fails', async () => {
      const messages = [{ key: 'key1', value: 'value1' }];
      jest.spyOn(fileProcessingProducer, 'sendBatchProcessedLines').mockRejectedValue(new Error('Kafka error'));

      await expect(fileProcessingProducer.sendBatchProcessedLine(messages)).rejects.toThrow('Kafka error');
    });
  });
});