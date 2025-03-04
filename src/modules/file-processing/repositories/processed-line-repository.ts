import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ProcessedLineEntity } from '../entities/processed-lines.entity';

@Injectable()
export class ProcessedLineRepository extends Repository<ProcessedLineEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(ProcessedLineEntity, dataSource.createEntityManager());
  }

  async createProcessedLine(
    lineData: Partial<ProcessedLineEntity>,
  ): Promise<ProcessedLineEntity> {
    const line = this.create(lineData);
    return await this.save(line);
  }

  async checkIfLineWasProcessed(lineHash: string): Promise<boolean> {
    const count = await this.count({ where: { lineHash } });
    return count > 0;
  }

  async bulkInsert(lines: Partial<ProcessedLineEntity>[]): Promise<void> {
    await this.createQueryBuilder()
      .insert()
      .into(ProcessedLineEntity)
      .values(lines)
      .orIgnore()
      .execute();
  }
}
