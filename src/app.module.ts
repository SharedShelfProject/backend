import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module';
import { jwtConfig } from './config/jwt.config';
import { createTypeOrmOptions } from './config/typeorm.config';
import { SharedShelfDatabaseModule } from './database/shared-shelf-database.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [jwtConfig],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => createTypeOrmOptions(),
    }),
    SharedShelfDatabaseModule,
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
