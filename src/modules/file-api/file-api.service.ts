import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { S3Service } from 'src/shared/storage/s3.service';
import { FileUploadRepository } from './repositories/file-upload.repository';
import { FileApiProducer } from './kafka/file-api.producer';
import { FileUploadedMessageDto } from 'src/shared/kafka/dtos/file-uploaded-message.dto';
import { extname } from 'path';
import { FileType } from 'src/shared/validators/file-validator.enum';

@Injectable()
export class FileApiService {
  private readonly logger = new Logger(FileApiService.name);
  constructor(
    private readonly fileUploadRepository: FileUploadRepository,
    private readonly s3Service: S3Service,
    private readonly fileApiProducer: FileApiProducer,
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

    const fileExtension = extname(file.originalname).toLowerCase();
    
    if (fileExtension !== '.csv') {
      throw new BadRequestException('Apenas arquivos CSV são permitidos.');
    }

    const s3Url = await this.s3Service.uploadFile(file, fileHash);
    const fileId = uuidv4();

    const fileInfo: FileUploadedMessageDto = {
      fileName: file.originalname,
      fileHash,
      fileId,
      s3Url,
      fileType: FileType.DEBT,
    };

    await this.fileApiProducer.notifyFileUploaded(fileInfo);

    await this.fileUploadRepository.createFile({
      id: fileId,
      fileHash,
      fileName: file.originalname,
      url: s3Url,
    });

    this.logger.log(`Arquivo enviado para processamento: ${file.originalname}`);
  }
}
