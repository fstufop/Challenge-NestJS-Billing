import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT || 5432),
  username: process.env.DATABASE_USER || 'user',
  password: process.env.DATABASE_PASSWORD || 'password',
  database: process.env.DATABASE_NAME || 'billing',
  synchronize: false,
  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  migrations: ['src/database/migrations/*.ts'],
  migrationsRun: false,
  logging: true,
});

export default AppDataSource;
