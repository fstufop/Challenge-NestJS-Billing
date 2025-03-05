import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { S3 } from 'aws-sdk';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class S3Service {
  private s3: S3;
  private bucketName = process.env.AWS_BUCKET_NAME || 'file-api-bucket';
  private readonly logger = new Logger(S3Service.name);
  constructor() {
    this.s3 = new S3({
      endpoint: process.env.AWS_S3_ENDPOINT,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      s3ForcePathStyle: true,
      signatureVersion: 'v4',
      region: process.env.AWS_REGION,
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    fileHash: string,
  ): Promise<string> {
    const fileExt = path.extname(file.originalname);
    const fileName = `${fileHash}${fileExt}`;

    const params: S3.PutObjectRequest = {
      Bucket: this.bucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    await this.s3.upload(params).promise();
    return `s3://${this.bucketName}/${fileName}`;
  }

  async downloadFile(fileKey: string, filePath: string): Promise<Buffer> {
    this.logger.debug(`Iniciando o download do arquivo ${fileKey}`);
    const key = fileKey.split('/').pop();
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key || '',
      };

      const response = await this.s3.getObject(params).promise();

      if (!response.Body) {
        throw new Error('Corpo da resposta do S3 está vazio.');
      }

      if (fs.existsSync(filePath)) {
        this.logger.warn(`O arquivo ${filePath} já existe e será sobrescrito.`);
      }

      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(filePath, response.Body as Buffer);
      this.logger.log(`Download do arquivo ${fileKey} concluído com sucesso.`);

      return response.Body as Buffer;
    } catch (error) {
      this.logger.debug(
        `Erro ao baixar o arquivo ${fileKey}: ${error.message}`,
      );
      throw new InternalServerErrorException(
        `Erro ao baixar o arquivo ${fileKey}: ${error.message}`,
      );
    }
  }
}
