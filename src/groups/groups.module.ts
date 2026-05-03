import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {AuthModule} from '../auth/auth.module';
import {BooksModule} from '../books/books.module';
import {Book} from '../database/entities/book.entity';
import {GroupBook} from '../database/entities/group-book.entity';
import {Group} from '../database/entities/group.entity';
import {GroupMembership} from '../database/entities/group-membership.entity';
import {User} from '../database/entities/user.entity';
import {CatalogController} from './catalog.controller';
import {CatalogService} from './catalog.service';
import {GroupsController} from './groups.controller';
import {GroupsService} from './groups.service';
import {MembersController} from './members.controller';
import {MembersService} from './members.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Group, GroupMembership, GroupBook, Book, User]),
        AuthModule,
        BooksModule,
    ],
    controllers: [GroupsController, MembersController, CatalogController],
    providers: [GroupsService, MembersService, CatalogService],
    exports: [GroupsService, MembersService, CatalogService],
})
export class GroupsModule {
}
