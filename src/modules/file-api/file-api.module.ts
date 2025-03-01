import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileApiService } from './file-api.service';
import { FileUploadRepository } from './repositories/file-upload.repository';
import { FileUploadEntity } from './entities/file-uploaded.entity';
import { S3Service } from 'src/shared/storage/s3.service';
import { FileApiController } from './file-api.controller';
import { FileApiProducer } from './kafka/file-api.producer';

@Module({
  imports: [TypeOrmModule.forFeature([FileUploadEntity])],
  providers: [FileApiService, FileUploadRepository, S3Service, FileApiProducer],
  controllers: [FileApiController],
  exports: [FileApiService, FileUploadRepository, S3Service],
})
export class FileApiModule {}