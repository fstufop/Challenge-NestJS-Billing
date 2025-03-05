import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDataValidationStatus1741124762792
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
                    ALTER TABLE payment 
                    ADD COLUMN IF NOT EXISTS error_message VARCHAR(500) NULL
                `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
                    ALTER TABLE payment DROP COLUMN IF EXISTS error_message;
                `);
  }
}
