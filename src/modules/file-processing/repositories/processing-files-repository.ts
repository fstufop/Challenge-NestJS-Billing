import { Injectable } from '@nestjs/common';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import {
  ProcessingFileEntity,
  ProcessingStatus,
} from '../entities/processing-files.entity';

@Injectable()
export class ProcessingFilesRepository extends Repository<ProcessingFileEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(ProcessingFileEntity, dataSource.createEntityManager());
  }

  async createProcessingFile(
    fileData: Partial<ProcessingFileEntity>,
  ): Promise<ProcessingFileEntity> {
    const file = this.create(fileData);
    return await this.save(file);
  }

  async updateProcessingFileStatus(
    fileId: string,
    status: ProcessingStatus,
  ): Promise<void> {
    await this.update({ id: fileId }, { status });
  }

  async findById(fileId: string) {
    return await this.findOne({ where: { id: fileId } });
  }

  async updateProcessingStats(
    fileId: string,
    stats: Partial<ProcessingFileEntity>,
  ): Promise<void> {
    await this.update(fileId, stats);
  }
}
