import { IsString, IsUUID, IsUrl } from 'class-validator';

export class FileUploadedMessageDto {
  @IsUUID()
  fileId: string;

  @IsString()
  fileName: string;

  @IsString()
  fileHash: string;

  @IsUrl()
  s3Url: string;
}
