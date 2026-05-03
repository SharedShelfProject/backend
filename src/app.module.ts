import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module';
import { BooksModule } from './books/books.module';
import { jwtConfig } from './config/jwt.config';
import { createTypeOrmOptions } from './config/typeorm.config';
import { SharedShelfDatabaseModule } from './database/shared-shelf-database.module';
import { GroupsModule } from './groups/groups.module';
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
    BooksModule,
    GroupsModule,
  ],
})
export class AppModule {}
