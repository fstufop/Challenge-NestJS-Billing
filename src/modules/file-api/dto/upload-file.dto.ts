import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class UploadFileDto {
  @IsNotEmpty()
  @IsString()
  fileName: string;

  @IsNotEmpty()
  @IsNumber()
  fileSize: number;
}