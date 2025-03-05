import { Injectable, Logger } from '@nestjs/common';
import { FileUploadedMessageDto } from 'src/shared/kafka/dtos/file-uploaded-message.dto';
import { S3Service } from 'src/shared/storage/s3.service';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { ProcessingFilesRepository } from './repositories/processing-files-repository';
import { ProcessedLineRepository } from './repositories/processed-line-repository';
import {
  LineStatus,
  ProcessedLineEntity,
} from './entities/processed-lines.entity';
import {
  ProcessingFileEntity,
  ProcessingStatus,
} from './entities/processing-files.entity';
import { FileProcessingProducer } from './kafka/file-proccessing.producer';
import * as fastCsv from 'fast-csv';
import { FileValidatorFactory } from 'src/modules/file-processing/strategies/file-validator.factory';
import { FileValidator } from 'src/modules/file-processing/strategies/file-validator.interface';

@Injectable()
export class FileProcessingService {
  private readonly logger = new Logger(FileProcessingService.name);
  private readonly batchSize = 5000;
  private readonly maxConcurrency = 40;
  private readonly kafkaBatchSize = 10000;

  constructor(
    private readonly s3Service: S3Service,
    private readonly processingFilesRepository: ProcessingFilesRepository,
    private readonly processedLineRepository: ProcessedLineRepository,
    private readonly fileProcessingProducer: FileProcessingProducer,
    private readonly fileValidatorFactory: FileValidatorFactory,
  ) {}

  async processMessage(fileInfo: FileUploadedMessageDto) {
    this.logger.log(`Iniciando processamento do arquivo ${fileInfo.fileId}`);
    const startTime = Date.now();

    let processingFile = await this.processingFilesRepository.findById(
      fileInfo.fileId,
    );

    if (!processingFile) {
      processingFile =
        await this.processingFilesRepository.createProcessingFile({
          id: fileInfo.fileId,
          fileName: fileInfo.fileName,
          fileHash: fileInfo.fileHash,
          status: ProcessingStatus.PENDING,
          totalRecords: 0,
          processedRecords: 0,
          failedRecords: 0,
        });
    }

    if (processingFile.status === ProcessingStatus.PENDING) {
      const filePath = `./temp/${fileInfo.fileName}`;
      const validator = this.fileValidatorFactory.getValidator(
        fileInfo.fileType,
      );

      await this.s3Service.downloadFile(fileInfo.s3Url, filePath);
      await this.processLargeFile(filePath, processingFile, validator);

      fs.unlinkSync(filePath);
    }

    const endTime = Date.now();
    const elapsedTime = (endTime - startTime) / 1000;

    this.logger.log(`Processamento do arquivo ${fileInfo.fileId} finalizado.`);
    this.logger.log(
      `⏱️ Tempo total de processamento: ${elapsedTime.toFixed(2)} segundos.`,
    );
  }

  private async processLargeFile(
    filePath: string,
    processingFile: ProcessingFileEntity,
    validator: FileValidator,
  ) {
    this.logger.log(`📂 Processando arquivo ${filePath}`);

    await this.processingFilesRepository.updateProcessingFileStatus(
      processingFile.id,
      ProcessingStatus.PROCESSING,
    );

    const fileStream = fs.createReadStream(filePath);
    const csvStream = fastCsv.parse({ headers: true, trim: true });

    let batch: ProcessedLineEntity[] = [];
    let kafkaBatch: any[] = [];
    let buffer: Promise<void>[] = [];
    let totalRecords = 0;
    let processedRecords = 0;
    let failedRecords = 0;

    fileStream.pipe(csvStream);

    for await (const row of csvStream) {
      totalRecords++;
      const { isValid, errors } = validator.validateLine(row);
      const lineHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(row))
        .digest('hex');

      const processedLine: ProcessedLineEntity = {
        id: uuidv4(),
        fileId: processingFile.id,
        status: isValid ? LineStatus.PROCESSED : LineStatus.ERROR,
        lineHash,
        rawData: JSON.stringify(row),
        errorMessage: errors.join(' '),
        createdAt: new Date(),
      };

      batch.push(processedLine);

      if (isValid) {
        processedRecords++;
        kafkaBatch.push({
          key: processedLine.lineHash,
          value: JSON.stringify(processedLine),
        });

        if (kafkaBatch.length >= this.kafkaBatchSize) {
          buffer.push(this.publishBatchToKafka(kafkaBatch));
          kafkaBatch = [];
        }
      } else {
        failedRecords++;
      }

      if (batch.length >= this.batchSize) {
        buffer.push(this.processedLineRepository.bulkInsert(batch));
        batch = [];
      }

      if (buffer.length >= this.maxConcurrency) {
        await Promise.all(buffer);
        buffer.length = 0;
      }
    }

    if (batch.length > 0) {
      await this.processedLineRepository.bulkInsert(batch);
    }

    if (kafkaBatch.length > 0) {
      await this.publishBatchToKafka(kafkaBatch);
    }

    await Promise.all(buffer);

    await this.processingFilesRepository.updateProcessingStats(
      processingFile.id,
      {
        totalRecords,
        processedRecords,
        failedRecords,
        status: this.getFileProcessedStatus(totalRecords, failedRecords),
      },
    );

    this.logger.log(`Arquivo ${processingFile.id} processado com sucesso!`);
  }

  private async publishBatchToKafka(messages: any[]) {
    await this.fileProcessingProducer.sendBatchProcessedLine(messages);
  }

  private getFileProcessedStatus(totalRecords: number, failedRecords: number) {
    if (failedRecords > 0) {
      return failedRecords === totalRecords
        ? ProcessingStatus.FAILED
        : ProcessingStatus.PROCESSED_WITH_ERRORS;
    } else {
      return ProcessingStatus.PROCESSED;
    }
  }
}
