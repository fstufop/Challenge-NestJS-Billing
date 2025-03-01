import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('file_uploaded')
export class FileUploadEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  file_name: string;

  @Column({ unique: true })
  file_hash: string;

  @Column()
  url: string;

  @CreateDateColumn()
  created_at: Date;
}