import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFileUploadedTable1740781693016
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS file_uploaded (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                file_name VARCHAR(255) NOT NULL,
                file_hash VARCHAR(255) UNIQUE NOT NULL,
                url TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS file_uploaded;`);
  }
}
