import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {AuthModule} from '../auth/auth.module';
import {Book} from '../database/entities/book.entity';
import {BorrowRequest} from '../database/entities/borrow-request.entity';
import {Loan} from '../database/entities/loan.entity';
import {User} from '../database/entities/user.entity';
import {BooksController} from './books.controller';
import {BooksService} from './books.service';

@Module({
    imports: [TypeOrmModule.forFeature([Book, User, BorrowRequest, Loan]), AuthModule],
    controllers: [BooksController],
    providers: [BooksService],
    exports: [BooksService],
})
export class BooksModule {
}
