import { Injectable } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import * as path from 'path';

@Injectable()
export class S3Service {
  private s3: S3;
  private bucketName = process.env.AWS_BUCKET_NAME || 'file-api-bucket';

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
}
