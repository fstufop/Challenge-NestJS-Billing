import { Injectable, Logger } from '@nestjs/common';
import { FileUploadedMessageDto } from 'src/shared/kafka/dtos/file-uploaded-message.dto';
import { S3Service } from 'src/shared/storage/s3.service';
import * as fs from 'fs';
import * as readline from 'readline';

@Injectable()
export class FileProcessingService {
  private readonly logger = new Logger(FileProcessingService.name);
  private readonly concurrency = 5;

  constructor(private readonly s3Service: S3Service) {}

  async proccessMessage(fileInfo: FileUploadedMessageDto) {
    this.logger.log(`Baixando arquivo ${fileInfo.fileId} do S3`);

    const filePath = `./temp/${fileInfo.fileName}`;

    await this.s3Service.downloadFile(fileInfo.s3Url, filePath);

    await this.processLargeFile(filePath);

    fs.unlinkSync(filePath);
  }

  private async processLargeFile(filePath: string) {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      this.logger.log(`Processando linha: ${line}`);
      // Aqui podemos fazer validações, salvar no banco, etc.
    }
  }
}
