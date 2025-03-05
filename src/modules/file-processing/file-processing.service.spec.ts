import { Test, TestingModule } from '@nestjs/testing';
import { FileProcessingService } from './file-processing.service';
import { S3Service } from '../../shared/storage/s3.service';
import { ProcessingFilesRepository } from './repositories/processing-files-repository';
import { ProcessedLineRepository } from './repositories/processed-line-repository';
import { FileProcessingProducer } from './kafka/file-proccessing.producer';
import { FileValidatorFactory } from '../../modules/file-processing/strategies/file-validator.factory';
import { FileValidator } from '../../modules/file-processing/strategies/file-validator.interface';
import { FileUploadedMessageDto } from '../../shared/kafka/dtos/file-uploaded-message.dto';
import {
  ProcessingStatus,
  ProcessingFileEntity,
} from './entities/processing-files.entity';
import * as fs from 'fs';
import { FileType } from './strategies/file-validator.enum';
import { PassThrough } from 'stream';

jest.mock('fs');
jest.mock('fast-csv');

describe('FileProcessingService', () => {
  let service: FileProcessingService;
  let s3Service: S3Service;
  let processingFilesRepository: ProcessingFilesRepository;
  let processedLineRepository: ProcessedLineRepository;
  let fileProcessingProducer: FileProcessingProducer;
  let fileValidatorFactory: FileValidatorFactory;
  let fileValidator: FileValidator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileProcessingService,
        {
          provide: S3Service,
          useValue: { downloadFile: jest.fn() },
        },
        {
          provide: ProcessingFilesRepository,
          useValue: {
            findById: jest.fn(),
            createProcessingFile: jest.fn(),
            updateProcessingFileStatus: jest.fn(),
            updateProcessingStats: jest.fn(),
          },
        },
        {
          provide: ProcessedLineRepository,
          useValue: {
            bulkInsert: jest.fn(),
          },
        },
        {
          provide: FileProcessingProducer,
          useValue: {
            sendBatchProcessedLine: jest.fn(),
          },
        },
        {
          provide: FileValidatorFactory,
          useValue: {
            getValidator: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FileProcessingService>(FileProcessingService);
    s3Service = module.get<S3Service>(S3Service);
    processingFilesRepository = module.get<ProcessingFilesRepository>(
      ProcessingFilesRepository,
    );
    processedLineRepository = module.get<ProcessedLineRepository>(
      ProcessedLineRepository,
    );
    fileProcessingProducer = module.get<FileProcessingProducer>(
      FileProcessingProducer,
    );
    fileValidatorFactory =
      module.get<FileValidatorFactory>(FileValidatorFactory);

    fileValidator = {
      validateLine: jest.fn().mockReturnValue({ isValid: true, errors: [] }),
    };

    jest
      .spyOn(fileValidatorFactory, 'getValidator')
      .mockReturnValue(fileValidator);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processMessage', () => {
    it('should not process if file status is not PENDING', async () => {
      const fileInfo: FileUploadedMessageDto = {
        fileId: '123',
        fileName: 'test.csv',
        fileHash: 'abc123',
        s3Url: 'http://s3-url',
        fileType: FileType.DEBT,
      };

      const processingFile: ProcessingFileEntity = {
        id: fileInfo.fileId,
        fileName: fileInfo.fileName,
        fileHash: fileInfo.fileHash,
        status: ProcessingStatus.PROCESSING,
        totalRecords: 0,
        processedRecords: 0,
        failedRecords: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest
        .spyOn(processingFilesRepository, 'findById')
        .mockResolvedValue(processingFile);

      await service.processMessage(fileInfo);

      expect(s3Service.downloadFile).not.toHaveBeenCalled();
    });
  });

  describe('publishBatchToKafka', () => {
    it('should call sendBatchProcessedLine with correct data', async () => {
      const messages = [
        { key: 'hash1', value: JSON.stringify({ data: 'value1' }) },
        { key: 'hash2', value: JSON.stringify({ data: 'value2' }) },
      ];

      await service['publishBatchToKafka'](messages);

      expect(
        fileProcessingProducer.sendBatchProcessedLine,
      ).toHaveBeenCalledWith(messages);
    });
  });

  describe('getFileProcessedStatus', () => {
    it('should return PROCESSED if no failed records', () => {
      expect(service['getFileProcessedStatus'](100, 0)).toBe(
        ProcessingStatus.PROCESSED,
      );
    });

    it('should return PROCESSED_WITH_ERRORS if some records failed', () => {
      expect(service['getFileProcessedStatus'](100, 10)).toBe(
        ProcessingStatus.PROCESSED_WITH_ERRORS,
      );
    });

    it('should return FAILED if all records failed', () => {
      expect(service['getFileProcessedStatus'](100, 100)).toBe(
        ProcessingStatus.FAILED,
      );
    });
  });
});
