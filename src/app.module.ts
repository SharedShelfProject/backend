import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { databaseConfig } from './config/database.config';
import { createTypeOrmOptions } from './config/typeorm.config';
import { SharedShelfDatabaseModule } from './database/shared-shelf-database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: () => createTypeOrmOptions(),
    }),
    SharedShelfDatabaseModule,
  ],
})
export class AppModule {}
