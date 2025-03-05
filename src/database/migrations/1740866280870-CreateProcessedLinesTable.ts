import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProcessedLinesTable1740866280870
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TABLE IF NOT EXISTS processed_lines (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            file_id UUID NOT NULL,
            line_hash CHAR(64) UNIQUE NOT NULL,
            status VARCHAR(20) NOT NULL,
            raw_data TEXT NOT NULL,
            error_message VARCHAR(255),
            created_at TIMESTAMP DEFAULT now(),
            CONSTRAINT fk_file FOREIGN KEY (file_id) REFERENCES processing_files(id) ON DELETE CASCADE
          );
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS processed_lines;`);
  }
}
