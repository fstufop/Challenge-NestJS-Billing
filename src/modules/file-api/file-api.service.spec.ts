import { Test, TestingModule } from '@nestjs/testing';
import { FileApiService } from './file-api.service';
import { FileUploadRepository } from './repositories/file-upload.repository';
import { FileApiProducer } from './kafka/file-api.producer';
import { S3Service } from '../../shared/storage/s3.service';
import { BadRequestException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { FileUploadedMessageDto } from '../../shared/kafka/dtos/file-uploaded-message.dto';
import { FileType } from '../../modules/file-processing/strategies/file-validator.enum';
import { FileUploadEntity } from './entities/file-uploaded.entity';

describe('FileApiService', () => {
  let service: FileApiService;
  let fileUploadRepository: jest.Mocked<FileUploadRepository>;
  let fileApiProducer: jest.Mocked<FileApiProducer>;
  let s3Service: jest.Mocked<S3Service>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileApiService,
        {
          provide: FileUploadRepository,
          useValue: {
            findFileByHash: jest.fn(),
            createFile: jest.fn(),
          },
        },
        {
          provide: S3Service,
          useValue: {
            uploadFile: jest.fn(),
          },
        },
        {
          provide: FileApiProducer,
          useValue: {
            notifyFileUploaded: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FileApiService>(FileApiService);
    fileUploadRepository = module.get(FileUploadRepository);
    fileApiProducer = module.get(FileApiProducer);
    s3Service = module.get(S3Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw an error if no file is provided', async () => {
    await expect(service.uploadFile(null as unknown as Express.Multer.File)).rejects.toThrow(
      new BadRequestException('É preciso carregar um arquivo para processamento'),
    );
  });

  it('should throw an error if file is not a CSV', async () => {
    const file = { originalname: 'test.pdf', buffer: Buffer.from('dummy data') } as Express.Multer.File;

    await expect(service.uploadFile(file)).rejects.toThrow(
      new BadRequestException('Apenas arquivos CSV são permitidos.'),
    );
  });

  it('should upload file to S3, notify Kafka, and save in repository', async () => {
    const fileBuffer = Buffer.from('dummy data');
    const file = { originalname: 'test.csv', buffer: fileBuffer } as Express.Multer.File;
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const s3Url = 's3://test-bucket/test.csv';
    const fileId = uuidv4();

    const fileMock: FileUploadEntity = {
      id: 'some-uuid',
      fileName: 'test-file.csv',
      fileHash: 'some-hash',
      url: 'https://s3-bucket-url.com/file.csv',
      createdAt: new Date(),
    };
    
    jest.spyOn(fileUploadRepository, 'findFileByHash').mockResolvedValue(fileMock);

    fileUploadRepository.findFileByHash.mockResolvedValueOnce(null);
    s3Service.uploadFile.mockResolvedValueOnce(s3Url);
    fileApiProducer.notifyFileUploaded.mockResolvedValueOnce(undefined);

    await service.uploadFile(file);

    expect(s3Service.uploadFile).toHaveBeenCalledWith(file, fileHash);
    expect(fileApiProducer.notifyFileUploaded).toHaveBeenCalledWith(
      expect.objectContaining<FileUploadedMessageDto>({
        fileName: file.originalname,
        fileHash,
        fileId: expect.any(String),
        s3Url,
        fileType: FileType.DEBT,
      }),
    );
    expect(fileUploadRepository.createFile).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        fileHash,
        fileName: file.originalname,
        url: s3Url,
      }),
    );
  });

  it('should throw an error if S3 upload fails', async () => {
    const fileBuffer = Buffer.from('dummy data');
    const file = { originalname: 'test.csv', buffer: fileBuffer } as Express.Multer.File;
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    fileUploadRepository.findFileByHash.mockResolvedValueOnce(null);
    s3Service.uploadFile.mockRejectedValueOnce(new Error('S3 upload failed'));

    await expect(service.uploadFile(file)).rejects.toThrow('S3 upload failed');
    expect(s3Service.uploadFile).toHaveBeenCalled();
  });

  it('should throw an error if Kafka notification fails', async () => {
    const fileBuffer = Buffer.from('dummy data');
    const file = { originalname: 'test.csv', buffer: fileBuffer } as Express.Multer.File;
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const s3Url = 's3://test-bucket/test.csv';

    fileUploadRepository.findFileByHash.mockResolvedValueOnce(null);
    s3Service.uploadFile.mockResolvedValueOnce(s3Url);
    fileApiProducer.notifyFileUploaded.mockRejectedValueOnce(new Error('Kafka notification failed'));

    await expect(service.uploadFile(file)).rejects.toThrow('Kafka notification failed');
    expect(fileApiProducer.notifyFileUploaded).toHaveBeenCalled();
  });

  it('should throw an error if database insert fails', async () => {
    const fileBuffer = Buffer.from('dummy data');
    const file = { originalname: 'test.csv', buffer: fileBuffer } as Express.Multer.File;
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const s3Url = 's3://test-bucket/test.csv';

    fileUploadRepository.findFileByHash.mockResolvedValueOnce(null);
    s3Service.uploadFile.mockResolvedValueOnce(s3Url);
    fileApiProducer.notifyFileUploaded.mockResolvedValueOnce(undefined);
    fileUploadRepository.createFile.mockRejectedValueOnce(new Error('Database error'));

    await expect(service.uploadFile(file)).rejects.toThrow('Database error');
    expect(fileUploadRepository.createFile).toHaveBeenCalled();
  });
});