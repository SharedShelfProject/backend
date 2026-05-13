import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {In, Repository} from 'typeorm';
import {BookStatus, BorrowRequestStatus, LoanStatus} from '../common/enums';
import {Book} from '../database/entities/book.entity';
import {BookReview} from '../database/entities/book-review.entity';
import {BorrowRequest} from '../database/entities/borrow-request.entity';
import {GroupBook} from '../database/entities/group-book.entity';
import {Loan} from '../database/entities/loan.entity';
import {User} from '../database/entities/user.entity';
import {BookDto} from './dto/book.dto';
import {UpdateBookDto} from "./dto/update-book.dto";
import {CreateBookDto} from "./dto/create-book.dto";

@Injectable()
export class BooksService {
    constructor(
        @InjectRepository(Book)
        private readonly bookRepository: Repository<Book>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(BorrowRequest)
        private readonly borrowRequestRepository: Repository<BorrowRequest>,
        @InjectRepository(Loan)
        private readonly loanRepository: Repository<Loan>,
    ) {
    }

    async createBook(userId: string, dto: CreateBookDto): Promise<BookDto> {
        const owner = await this.findActiveUser(userId);

        const book = this.bookRepository.create({
            title: dto.title,
            author: dto.author,
            isbn: dto.isbn ?? null,
            genre: dto.genre ?? null,
            publicationYear: dto.publicationYear ?? null,
            language: dto.language ?? null,
            description: dto.description ?? null,
            condition: dto.condition ?? null,
            owner,
        });

        await this.bookRepository.save(book);
        return this.toDto(book);
    }

    async getMyBooks(userId: string): Promise<BookDto[]> {
        const books = await this.bookRepository.find({
            where: {owner: {id: userId}},
            relations: ['owner'],
            order: {createdAt: 'DESC'},
        });

        return books.map(this.toDto);
    }

    async getBookById(bookId: string): Promise<BookDto> {
        const book = await this.findBook(bookId);
        return this.toDto(book);
    }

    async updateBook(userId: string, bookId: string, dto: UpdateBookDto): Promise<BookDto> {
        const book = await this.findBook(bookId);
        this.assertOwner(book, userId);

        if (dto.title !== undefined) book.title = dto.title;
        if (dto.author !== undefined) book.author = dto.author;
        if (dto.isbn !== undefined) book.isbn = dto.isbn;
        if (dto.genre !== undefined) book.genre = dto.genre;
        if (dto.publicationYear !== undefined) book.publicationYear = dto.publicationYear;
        if (dto.language !== undefined) book.language = dto.language;
        if (dto.description !== undefined) book.description = dto.description;
        if (dto.condition !== undefined) book.condition = dto.condition;
        if (dto.status !== undefined) {
            await this.applyManualStatusChange(book, dto.status);
        }

        await this.bookRepository.save(book);
        return this.toDto(book);
    }

    async deleteBook(userId: string, bookId: string): Promise<void> {
        const book = await this.findBook(bookId);
        this.assertOwner(book, userId);

        const activeLoan = await this.loanRepository.findOne({
            where: {
                book: {id: bookId},
                status: In([LoanStatus.ACTIVE, LoanStatus.OVERDUE]),
            },
        });

        if (activeLoan) {
            throw new BadRequestException('You cannot delete a book while it is borrowed');
        }

        await this.bookRepository.manager.transaction(async (manager) => {
            await manager
                .createQueryBuilder()
                .delete()
                .from(BookReview)
                .where('book_id = :bookId', {bookId})
                .execute();

            await manager
                .createQueryBuilder()
                .delete()
                .from(BorrowRequest)
                .where('book_id = :bookId', {bookId})
                .execute();

            await manager
                .createQueryBuilder()
                .delete()
                .from(Loan)
                .where('book_id = :bookId', {bookId})
                .execute();

            await manager
                .createQueryBuilder()
                .delete()
                .from(GroupBook)
                .where('book_id = :bookId', {bookId})
                .execute();

            await manager
                .createQueryBuilder()
                .delete()
                .from(Book)
                .where('id = :bookId', {bookId})
                .execute();
        });
    }

    private async findBook(bookId: string): Promise<Book> {
        const book = await this.bookRepository.findOne({
            where: {id: bookId},
            relations: ['owner'],
        });
        if (!book) throw new NotFoundException('Book not found');
        return book;
    }

    private async findActiveUser(userId: string): Promise<User> {
        const user = await this.userRepository.findOne({
            where: {id: userId, isActive: true},
        });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    private assertOwner(book: Book, userId: string): void {
        if (book.owner.id !== userId) {
            throw new ForbiddenException('You do not own this book');
        }
    }

    private async applyManualStatusChange(book: Book, nextStatus: BookStatus): Promise<void> {
        const activeLoan = await this.loanRepository.findOne({
            where: {
                book: {id: book.id},
                status: In([LoanStatus.ACTIVE, LoanStatus.OVERDUE]),
            },
        });

        if (activeLoan) {
            throw new BadRequestException('You cannot manually change the status of a borrowed book');
        }

        const approvedRequestsCount = await this.borrowRequestRepository.count({
            where: {
                book: {id: book.id},
                status: BorrowRequestStatus.APPROVED,
            },
        });

        if (nextStatus === BookStatus.BORROWED || nextStatus === BookStatus.QUEUED) {
            throw new BadRequestException(
                'Borrowed and queued statuses are managed automatically by the system',
            );
        }

        if (approvedRequestsCount > 0 && nextStatus === BookStatus.AVAILABLE) {
            throw new BadRequestException(
                'This book has a waiting queue. Resolve the queue before marking it available manually',
            );
        }

        book.status = nextStatus;
    }

    toDto(book: Book): BookDto {
        return {
            id: book.id,
            title: book.title,
            author: book.author,
            isbn: book.isbn,
            genre: book.genre,
            publicationYear: book.publicationYear,
            language: book.language,
            description: book.description,
            coverUrl: book.coverUrl,
            condition: book.condition,
            status: book.status,
            ownerId: book.owner.id,
            ownerUsername: book.owner.username,
            createdAt: book.createdAt,
        };
    }
}
