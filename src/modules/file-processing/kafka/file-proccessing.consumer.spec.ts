import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { FileProcessingService } from '../file-processing.service';
import { KafkaConsumer } from '../../../shared/kafka/kafka.consumer';
import { KafkaMessage } from 'kafkajs';
import { FileProcessingConsumer } from './file-proccessing.consumer';

describe('FileProcessingConsumer', () => {
  let fileProcessingConsumer: FileProcessingConsumer;
  let fileProcessingServiceMock: jest.Mocked<FileProcessingService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileProcessingConsumer,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('localhost:9092'),
          },
        },
        {
          provide: FileProcessingService,
          useValue: {
            processMessage: jest.fn(),
          },
        },
        {
          provide: KafkaConsumer,
          useValue: {
            processMessage: jest.fn(),
          },
        },
      ],
    }).compile();

    fileProcessingConsumer = module.get<FileProcessingConsumer>(
      FileProcessingConsumer,
    );
    fileProcessingServiceMock = module.get<FileProcessingService>(
      FileProcessingService,
    ) as jest.Mocked<FileProcessingService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(fileProcessingConsumer).toBeDefined();
  });

  it('should call fileProcessingService.processMessage when receiving a valid message', async () => {
    const kafkaMessage: KafkaMessage = {
      key: Buffer.from('test-key'),
      value: Buffer.from(
        JSON.stringify({
          fileId: '123',
          fileName: 'test.csv',
          s3Url: 's3://bucket/test.csv',
        }),
      ),
      timestamp: '1623456789000',
      attributes: 0,
      offset: '0',
      headers: {},
    };

    await fileProcessingConsumer['processMessage'](kafkaMessage);

    expect(fileProcessingServiceMock.processMessage).toHaveBeenCalledWith({
      fileId: '123',
      fileName: 'test.csv',
      s3Url: 's3://bucket/test.csv',
    });
  });

  it('should log a warning when receiving an empty message', async () => {
    const kafkaMessage: KafkaMessage = {
      key: Buffer.from('test-key'),
      value: null,
      timestamp: '1623456789000',
      attributes: 0,
      offset: '0',
      headers: {},
    };

    const loggerSpy = jest.spyOn(fileProcessingConsumer['logger'], 'debug');

    await fileProcessingConsumer['processMessage'](kafkaMessage);

    expect(loggerSpy).toHaveBeenCalledWith('Mesagem recebida sem conteúdo');
    expect(fileProcessingServiceMock.processMessage).not.toHaveBeenCalled();
  });
});
