import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  GENERATED = 'GENERATED',
  RETRY_GENERATE = 'RETRY_GENERATE',
  RETRYING_GENERATE = 'RETRYING_GENERATE',
  RETRY_SEND = 'RETRY_SEND',
  RETRYING_SEND = 'RETRYING_SEND',
  SENT = 'SENT',
  PAID = 'PAID',
  CANCELED = 'CANCELED',
  GENERATE_FAILED = 'GENERATE_FAILED',
  SEND_FAILED = 'SEND_FAILED',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

@Entity('payment')
export class PaymentEntity {
  @PrimaryColumn('uuid', { name: 'debt_id' })
  debtId: string;

  @Column({ type: 'varchar', length: 255, name: 'name' })
  name: string;

  @Column({ type: 'uuid', name: 'processing_file_id' })
  processingFileId: string;

  @Column({ type: 'varchar', length: 60, name: 'government_id' })
  governmentId: string;

  @Column({ type: 'varchar', length: 20, enum: PaymentStatus, name: 'status' })
  status: PaymentStatus;

  @Column({ type: 'varchar', length: 255, name: 'email' })
  email: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'debt_amount' })
  debtAmount: number;

  @Column({ type: 'varchar', length: 60, nullable: true, name: 'barcode' })
  barcode?: string;

  @Column({ type: 'int', default: 0, name: 'generate_retries' })
  generateRetries: number;

  @Column({ type: 'int', default: 0, name: 'send_retries' })
  sendRetries: number;

  @Column({ type: 'date', name: 'due_date' })
  dueDate: Date;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    name: 'error_message',
  })
  errorMessage?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
