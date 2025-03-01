import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { FileUploadEntity } from './entities/file-uploaded.entity';
import { S3Service } from 'src/shared/storage/s3.service';
import { FileUploadRepository } from './repositories/file-upload.repository';

@Injectable()
export class FileApiService {
  private readonly logger = new Logger(FileApiService.name);
  constructor(
    private readonly fileUploadRepository: FileUploadRepository,
    private readonly s3Service: S3Service,
  ) {}

  async uploadFile(file: Express.Multer.File) {
    if (!file)
      throw new BadRequestException(
        'É preciso carregar um arquivo para processamento',
      );

    const fileHash = crypto
      .createHash('sha256')
      .update(file.buffer)
      .digest('hex');

    const existingFile =
      await this.fileUploadRepository.findFileByHash(fileHash);
    if (existingFile)
      throw new BadRequestException(
        'Este arquivo já foi enviado para processamento',
      );

    const s3Path = await this.s3Service.uploadFile(file, fileHash);

    await this.fileUploadRepository.createFile({
      fileHash,
      fileName: file.originalname,
      url: s3Path,
    });

    this.logger.log(`Arquivo enviado para processamento: ${file.originalname}`);
  }
}
