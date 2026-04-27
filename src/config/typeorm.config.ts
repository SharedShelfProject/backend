import 'dotenv/config';

import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';

import { Book } from '../database/entities/book.entity';
import { Group } from '../database/entities/group.entity';
import { GroupBook } from '../database/entities/group-book.entity';
import { GroupMembership } from '../database/entities/group-membership.entity';
import { Loan } from '../database/entities/loan.entity';
import { Notification } from '../database/entities/notification.entity';
import { RefreshToken } from '../database/entities/refresh-token.entity';
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
  RefreshToken,
];

function createBaseOptions(): TypeOrmModuleOptions & DataSourceOptions {
  return {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number.parseInt(process.env.DB_PORT!, 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities,
    synchronize: false,
  };
}

export function createTypeOrmOptions(): TypeOrmModuleOptions {
  return createBaseOptions();
}

export function createDataSourceOptions(): DataSourceOptions {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    ...createBaseOptions(),
    migrations: [
      isProd
        ? 'dist/database/migrations/*.js'
        : 'src/database/migrations/*.ts',
    ],
  };
}

const dataSource = new DataSource(createDataSourceOptions());

export default dataSource;
