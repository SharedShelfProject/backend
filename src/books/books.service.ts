import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {Book} from '../database/entities/book.entity';
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
        if (dto.status !== undefined) book.status = dto.status;

        await this.bookRepository.save(book);
        return this.toDto(book);
    }

    async deleteBook(userId: string, bookId: string): Promise<void> {
        const book = await this.findBook(bookId);
        this.assertOwner(book, userId);
        await this.bookRepository.remove(book);
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
