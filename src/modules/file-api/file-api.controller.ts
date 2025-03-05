import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { FileApiService } from './file-api.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('files')
export class FileApiController {
  constructor(private readonly fileApiService: FileApiService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Envia arquivo para processamento' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Arquivo enviado com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro no envio do arquivo' })
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    await this.fileApiService.uploadFile(file);
    return {
      message: `O arquivo ${file.originalname} foi enviado com sucesso`,
    };
  }
}
