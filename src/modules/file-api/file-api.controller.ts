import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { FileApiService } from './file-api.service';

@Controller('files')
export class FileApiController {
  constructor(private readonly fileApiService: FileApiService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    await this.fileApiService.uploadFile(file);
    return {
      message: `O arquivo ${file.originalname} foi enviado com sucesso`,
    };
  }
}
