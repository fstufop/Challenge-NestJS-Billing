import { IsString, IsUUID } from "class-validator";

export class ProcessedLineMessageDto {
  @IsUUID()
  fileId: string;

  @IsString()
  line_hash: string;

  @IsString()
  raw_data: string;
}
