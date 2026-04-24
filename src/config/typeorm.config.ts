import 'dotenv/config';

import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';

import { Book } from '../database/entities/book.entity';
import { Group } from '../database/entities/group.entity';
import { GroupBook } from '../database/entities/group-book.entity';
import { GroupMembership } from '../database/entities/group-membership.entity';
import { Loan } from '../database/entities/loan.entity';
import { Notification } from '../database/entities/notification.entity';
import { ReputationReview } from '../database/entities/reputation-review.entity';
import { User } from '../database/entities/user.entity';
import { BorrowRequest } from '../database/entities/borrow-request.entity';

const entities = [
  User,
  Group,
  GroupMembership,
  Book,
  GroupBook,
  BorrowRequest,
  Loan,
  Notification,
  ReputationReview,
];

function createBaseOptions(): TypeOrmModuleOptions & DataSourceOptions {
  return {
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number.parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'shared_shelf',
    entities,
    synchronize: false,
  };
}

export function createTypeOrmOptions(): TypeOrmModuleOptions {
  return createBaseOptions();
}

export function createDataSourceOptions(): DataSourceOptions {
  return {
    ...createBaseOptions(),
    migrations: ['src/database/migrations/*.ts'],
  };
}

export const typeOrmModuleOptions: TypeOrmModuleOptions = createTypeOrmOptions();

export const dataSourceOptions: DataSourceOptions = createDataSourceOptions();

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
