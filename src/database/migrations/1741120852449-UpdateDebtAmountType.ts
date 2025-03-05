import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateDebtAmountType1741120852449 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE payment ALTER COLUMN debt_amount TYPE NUMERIC(10,2) USING debt_amount::NUMERIC(10,2);
          `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE payment ALTER COLUMN debt_amount TYPE INTEGER USING debt_amount::INTEGER;
          `);
  }
}
