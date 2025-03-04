import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { ProcessingFileEntity } from './processing-files.entity';

export enum LineStatus {
  PROCESSED = 'PROCESSED',
  ERROR = 'ERROR',
}

@Entity('processed_lines')
export class ProcessedLineEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column({ name: 'file_id', type: 'uuid' })
  fileId: string;

  @Column({ name: 'line_hash', type: 'char', length: 64, unique: true })
  lineHash: string;

  @Column({
    type: 'enum',
    enum: LineStatus,
  })
  status: LineStatus;

  @Column({ name: 'raw_data', type: 'text' })
  rawData: string;

  @Column({
    name: 'error_message',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  errorMessage?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
