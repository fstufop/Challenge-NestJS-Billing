import { Injectable, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { FileUploadEntity } from './entities/file-uploaded.entity';
import { S3Service } from 'src/shared/storage/s3.service';
import { FileUploadRepository } from './repositories/file-upload.repository';

@Injectable()
export class FileApiService {
    constructor(
        private readonly fileUploadRepository: FileUploadRepository,
        private readonly s3Service: S3Service,
      ) {}

    async uploadFile(file: Express.Multer.File): Promise<FileUploadEntity> {
        if (!file) throw new BadRequestException('File is required');
      
        const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');
      
        const existingFile = await this.fileUploadRepository.findFileByHash(fileHash);
        if (existingFile) throw new BadRequestException('File already uploaded');
      
        const s3Path = await this.s3Service.uploadFile(file, fileHash);
      
        const fileUpload = this.fileUploadRepository.createFile({
          file_hash: fileHash,
          file_name: file.originalname,
          url: s3Path,
        });
      
        return fileUpload
      }
}
