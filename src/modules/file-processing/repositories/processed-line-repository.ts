import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { LineStatus, ProcessedLineEntity } from '../entities/processed-lines.entity';

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
    if (lines.length === 0) return;
  
    const values = lines
      .map((line) => {
        const id = line.id ?? uuidv4();
        const fileId = line.fileId ?? '';
        const lineHash = line.lineHash ?? '';
        const status = line.status ?? LineStatus.ERROR;
        const rawData = (line.rawData ?? '').replace(/'/g, "''");
        const errorMessage = (line.errorMessage ?? '').replace(/'/g, "''");
        const createdAt = new Date(line.createdAt ?? new Date()).toISOString();
  
        return `('${id}', '${fileId}', '${lineHash}', '${status}', '${rawData}', '${errorMessage}', '${createdAt}')`;
      })
      .join(',');
  
    const query = `
      INSERT INTO processed_lines (id, file_id, line_hash, status, raw_data, error_message, created_at)
      VALUES ${values}
      ON CONFLICT (line_hash) DO NOTHING;
    `;
  
    await this.manager.query(query);
  }
}
