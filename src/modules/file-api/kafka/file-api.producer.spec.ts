import { Test, TestingModule } from '@nestjs/testing';
import { FileApiProducer } from './file-api.producer';
import { KafkaProducer } from '../../../shared/kafka/kafka.producer';
import { ConfigService } from '@nestjs/config';
import { FileUploadedMessageDto } from '../../../shared/kafka/dtos/file-uploaded-message.dto';
import { KafkaTopics } from '../../../shared/kafka/enums/kafka.topics.enum';
import { FileType } from '../../../modules/file-processing/strategies/file-validator.enum';

jest.mock('../../../shared/kafka/kafka.producer');

describe('FileApiProducer', () => {
  let fileApiProducer: FileApiProducer;
  let kafkaProducerMock: jest.Mocked<KafkaProducer>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileApiProducer,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('localhost:9092'),
          },
        },
        {
          provide: KafkaProducer,
          useValue: {
            sendMessage: jest.fn(),
          },
        },
      ],
    }).compile();

    fileApiProducer = module.get<FileApiProducer>(FileApiProducer);
    kafkaProducerMock = module.get<KafkaProducer>(
      KafkaProducer,
    ) as jest.Mocked<KafkaProducer>;
  });

  it('should be defined', () => {
    expect(fileApiProducer).toBeDefined();
  });

  it('should call sendMessage when notifying file upload', async () => {
    const file: FileUploadedMessageDto = {
      fileName: 'test.csv',
      fileHash: '123abc',
      fileId: 'file-uuid',
      s3Url: 's3://bucket/test.csv',
      fileType: FileType.DEBT,
    };

    const sendMessageMock = jest
      .spyOn(KafkaProducer.prototype, 'sendMessage')
      .mockResolvedValue(undefined);

    await fileApiProducer.notifyFileUploaded(file);

    expect(sendMessageMock).toHaveBeenCalledWith(
      KafkaTopics.fileUploaded,
      file,
    );
  });

  it('should log an error if sendMessage fails', async () => {
    const file: FileUploadedMessageDto = {
      fileName: 'test.csv',
      fileHash: '123abc',
      fileId: 'file-uuid',
      s3Url: 's3://bucket/test.csv',
      fileType: FileType.DEBT,
    };

    jest
      .spyOn(KafkaProducer.prototype, 'sendMessage')
      .mockRejectedValue(new Error('Kafka error'));

    await expect(fileApiProducer.notifyFileUploaded(file)).rejects.toThrow(
      'Kafka error',
    );
  });
});
