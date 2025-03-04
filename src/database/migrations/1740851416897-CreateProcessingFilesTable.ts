import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProcessingFilesTable1740851416897
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TABLE IF NOT EXISTS processing_files (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            file_name VARCHAR(255) NOT NULL,
            file_hash VARCHAR(64) NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
            total_records INT NOT NULL DEFAULT 0,
            processed_records INT NOT NULL DEFAULT 0,
            failed_records INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS processing_files;`);
  }
}
