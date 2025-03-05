import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePaymentTable1741119541108 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TABLE IF NOT EXISTS payment (
              debt_id UUID PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              processing_file_id UUID NOT NULL,
              government_id VARCHAR(60) NOT NULL,
              status VARCHAR(20) NOT NULL,
              email VARCHAR(255) NOT NULL,
              debt_amount INT NOT NULL,
              barcode VARCHAR(60),
              generate_retries INT DEFAULT 0 NOT NULL,
              send_retries INT DEFAULT 0 NOT NULL,
              due_date DATE NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS payment;`);
  }
}
