import { Module } from '@nestjs/common';
import { FileApiController } from './file-api.controller';
import { FileApiService } from './file-api.service';

@Module({
  controllers: [FileApiController],
  providers: [FileApiService]
})
export class FileApiModule {}
