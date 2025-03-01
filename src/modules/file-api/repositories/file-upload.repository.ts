import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileUploadEntity } from '../entities/file-uploaded.entity';

@Injectable()
export class FileUploadRepository {
  constructor(
    @InjectRepository(FileUploadEntity)
    private readonly repo: Repository<FileUploadEntity>,
  ) {}

  async createFile(data: Partial<FileUploadEntity>): Promise<FileUploadEntity> {
    const file = this.repo.create(data);
    return this.repo.save(file);
  }

  async findFileByHash(fileHash: string): Promise<FileUploadEntity | null> {
    return this.repo.findOne({ where: { file_hash: fileHash } });
  }

  async findFileById(id: string): Promise<FileUploadEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async getAllFiles(): Promise<FileUploadEntity[]> {
    return this.repo.find();
  }
}