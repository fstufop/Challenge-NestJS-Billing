import { Injectable, Logger } from '@nestjs/common';
import { FileUploadedMessageDto } from 'src/shared/kafka/dtos/file-uploaded-message.dto';
import { S3Service } from 'src/shared/storage/s3.service';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { ProcessingFilesRepository } from './repositories/processing-files-repository';
import { ProcessedLineRepository } from './repositories/processed-line-repository';
import { LineStatus, ProcessedLineEntity } from './entities/processed-lines.entity';
import { ProcessingFileEntity, ProcessingStatus } from './entities/processing-files.entity';
import { FileProcessingProducer } from './kafka/file-proccessing.producer';
import * as fastCsv from 'fast-csv';

@Injectable()
export class FileProcessingService {
  private readonly logger = new Logger(FileProcessingService.name);
  private readonly batchSize = 10000;
  private readonly maxConcurrency = 50;

  constructor(
    private readonly s3Service: S3Service,
    private readonly processingFilesRepository: ProcessingFilesRepository,
    private readonly processedLineRepository: ProcessedLineRepository,
    private readonly fileProcessingProducer: FileProcessingProducer,
  ) {}

  async proccessMessage(fileInfo: FileUploadedMessageDto) {
    this.logger.log(`📥 Baixando arquivo ${fileInfo.fileId} do S3`);

    let processingFile = await this.processingFilesRepository.findById(fileInfo.fileId);

    if (!processingFile) {
      processingFile = await this.processingFilesRepository.createProcessingFile({
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

      await this.s3Service.downloadFile(fileInfo.s3Url, filePath);
      await this.processLargeFile(filePath, processingFile);

      fs.unlinkSync(filePath);
    }
  }

  private async processLargeFile(filePath: string, processingFile: ProcessingFileEntity) {
    this.logger.log(`🚀 Iniciando processamento do arquivo ${filePath}`);

    await this.processingFilesRepository.updateProcessingFileStatus(processingFile.id, ProcessingStatus.PROCESSING);

    const fileStream = fs.createReadStream(filePath);
    const csvStream = fastCsv.parse({ headers: true, trim: true });

    let batch: ProcessedLineEntity[] = [];
    let kafkaBatch: any[] = [];
    let buffer: Promise<void>[] = [];
    let totalRecords = 0;
    let processedRecords = 0;
    let failedRecords = 0;

    // const existingHashes = new Set(
    //   await this.processedLineRepository.getExistingHashesByFileId(processingFile.id),
    // );

    fileStream.pipe(csvStream);

    for await (const row of csvStream) {
      totalRecords++;
      const { isValid, errors } = this.validateLine(row);
      const lineHash = crypto.createHash('sha256').update(JSON.stringify(row)).digest('hex');

    //   if (existingHashes.has(lineHash)) continue; // Ignora linhas já processadas

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

        if (kafkaBatch.length >= this.batchSize) {
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

    await this.processingFilesRepository.updateProcessingStats(processingFile.id, {
      totalRecords,
      processedRecords,
      failedRecords,
      status: this.getFileProcessedStatus(totalRecords, failedRecords),
    });

    this.logger.log(`✅ Arquivo ${processingFile.id} processado com sucesso!`);
  }

  private validateLine(row: any) {
    const errors: string[] = [];

    if (!row.name) errors.push('Nome ausente');
    if (!row.governmentId) errors.push('Número do documento ausente');
    if (!row.email || !this.isValidEmail(row.email)) errors.push('Email inválido');
    if (!row.debtAmount || parseFloat(row.debtAmount) <= 0) errors.push('Valor do débito inválido');
    if (!row.debtDueDate || isNaN(Date.parse(row.debtDueDate))) errors.push('Data do débito inválida');
    if (!row.debtId) errors.push('UUID do débito ausente');

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private async publishBatchToKafka(messages: any[]) {
    await this.fileProcessingProducer.sendBatchProcessedLine(messages);
  }

  private getFileProcessedStatus(totalRecords: number, failedRecords: number) {
    if (failedRecords > 0) {
      return failedRecords === totalRecords ? ProcessingStatus.FAILED : ProcessingStatus.PROCESSED_WITH_ERRORS;
    } else {
      return ProcessingStatus.PROCESSED;
    }
  }
}