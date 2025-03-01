import { Module } from '@nestjs/common';
import { FileProcessingController } from './file-processing.controller';
import { FileProcessingService } from './file-processing.service';
import { S3Service } from 'src/shared/storage/s3.service';

@Module({
  controllers: [FileProcessingController],
  providers: [FileProcessingService, S3Service],
  exports: [FileProcessingService],
})
export class FileProcessingModule {}
