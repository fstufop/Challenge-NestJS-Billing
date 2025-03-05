import { Module } from '@nestjs/common';
import { FileProcessingController } from './file-processing.controller';
import { FileProcessingService } from './file-processing.service';
import { S3Service } from 'src/shared/storage/s3.service';
import { ProcessedLineRepository } from './repositories/processed-line-repository';
import { ProcessingFilesRepository } from './repositories/processing-files-repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessedLineEntity } from './entities/processed-lines.entity';
import { ProcessingFileEntity } from './entities/processing-files.entity';
import { FileProcessingProducer } from './kafka/file-proccessing.producer';
import { FileValidatorFactory } from 'src/modules/file-processing/strategies/file-validator.factory';
import { DebtFileValidator } from 'src/modules/file-processing/strategies/debt-file.validator';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProcessingFilesRepository,
      ProcessedLineEntity,
      ProcessingFileEntity,
    ]),
  ],
  controllers: [FileProcessingController],
  providers: [
    FileProcessingService,
    S3Service,
    ProcessingFilesRepository,
    ProcessedLineRepository,
    FileProcessingProducer,
    FileValidatorFactory,
    DebtFileValidator,
  ],
  exports: [
    FileProcessingService,
    ProcessingFilesRepository,
    ProcessedLineRepository,
    FileValidatorFactory,
  ],
})
export class FileProcessingModule {}
