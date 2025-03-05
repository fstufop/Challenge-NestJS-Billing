import { IsEnum, IsString, IsUUID, IsUrl } from 'class-validator';
import { FileType } from 'src/modules/file-processing/strategies/file-validator.enum';

export class FileUploadedMessageDto {
  @IsUUID()
  fileId: string;

  @IsString()
  fileName: string;

  @IsString()
  fileHash: string;

  @IsUrl()
  s3Url: string;

  @IsEnum(FileType)
  fileType: FileType;
}
