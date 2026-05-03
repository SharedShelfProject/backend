import {
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {GroupMemberRole, GroupMemberStatus} from '../common/enums';
import {BooksService} from '../books/books.service';
import {Book} from '../database/entities/book.entity';
import {GroupBook} from '../database/entities/group-book.entity';
import {GroupMembership} from '../database/entities/group-membership.entity';
import {Group} from '../database/entities/group.entity';
import {CatalogEntryDto} from "./dto/catalog-entry.dto";
import {AddBookToCatalogDto} from "./dto/add-book-to-catalog.dto";
import {UpdateCatalogEntryDto} from "./dto/update-catalog-entry.dto";

@Injectable()
export class CatalogService {
    constructor(
        @InjectRepository(Group)
        private readonly groupRepository: Repository<Group>,
        @InjectRepository(GroupBook)
        private readonly groupBookRepository: Repository<GroupBook>,
        @InjectRepository(GroupMembership)
        private readonly membershipRepository: Repository<GroupMembership>,
        @InjectRepository(Book)
        private readonly bookRepository: Repository<Book>,
        private readonly booksService: BooksService,
    ) {
    }

    async getCatalog(groupId: string, requesterId: string): Promise<CatalogEntryDto[]> {
        await this.requireActiveMember(groupId, requesterId);

        const entries = await this.groupBookRepository.find({
            where: {group: {id: groupId}},
            relations: ['book', 'book.owner'],
            order: {addedAt: 'DESC'},
        });

        return entries.map((e) => this.toDto(e, groupId));
    }

    async addBook(
        groupId: string,
        requesterId: string,
        dto: AddBookToCatalogDto,
    ): Promise<CatalogEntryDto> {
        const membership = await this.requireActiveMember(groupId, requesterId);

        const group = await this.groupRepository.findOne({where: {id: groupId}});
        if (!group) throw new NotFoundException('Group not found');

        const book = await this.bookRepository.findOne({
            where: {id: dto.bookId},
            relations: ['owner'],
        });
        if (!book) throw new NotFoundException('Book not found');

        if (book.owner.id !== requesterId) {
            throw new ForbiddenException('You can only add your own books to the catalog');
        }

        const existing = await this.groupBookRepository.findOne({
            where: {group: {id: groupId}, book: {id: dto.bookId}},
        });
        if (existing) throw new ConflictException('Book is already in this group catalog');

        const entry = this.groupBookRepository.create({
            group,
            book,
            isVisible: true,
            addedAt: new Date(),
        });

        await this.groupBookRepository.save(entry);
        return this.toDto(entry, groupId);
    }

    async updateEntry(
        groupId: string,
        entryId: string,
        requesterId: string,
        dto: UpdateCatalogEntryDto,
    ): Promise<CatalogEntryDto> {
        const membership = await this.requireActiveMember(groupId, requesterId);

        const entry = await this.findEntry(groupId, entryId);

        const isAdminOrOwner =
            membership.role === GroupMemberRole.OWNER ||
            membership.role === GroupMemberRole.ADMIN;
        const isBookOwner = entry.book.owner.id === requesterId;

        if (!isAdminOrOwner && !isBookOwner) {
            throw new ForbiddenException(
                'Only the book owner or group admins can update catalog entries',
            );
        }

        entry.isVisible = dto.isVisible;
        await this.groupBookRepository.save(entry);

        return this.toDto(entry, groupId);
    }

    async removeBook(
        groupId: string,
        entryId: string,
        requesterId: string,
    ): Promise<void> {
        const membership = await this.requireActiveMember(groupId, requesterId);

        const entry = await this.findEntry(groupId, entryId);

        const isAdminOrOwner =
            membership.role === GroupMemberRole.OWNER ||
            membership.role === GroupMemberRole.ADMIN;
        const isBookOwner = entry.book.owner.id === requesterId;

        if (!isAdminOrOwner && !isBookOwner) {
            throw new ForbiddenException(
                'Only the book owner or group admins can remove books from the catalog',
            );
        }

        await this.groupBookRepository.remove(entry);
    }

    private async requireActiveMember(
        groupId: string,
        userId: string,
    ): Promise<GroupMembership> {
        const membership = await this.membershipRepository.findOne({
            where: {
                group: {id: groupId},
                user: {id: userId},
                status: GroupMemberStatus.ACTIVE,
            },
        });

        if (!membership) {
            throw new ForbiddenException('You are not an active member of this group');
        }

        return membership;
    }

    private async findEntry(groupId: string, entryId: string): Promise<GroupBook> {
        const entry = await this.groupBookRepository.findOne({
            where: {id: entryId, group: {id: groupId}},
            relations: ['book', 'book.owner'],
        });

        if (!entry) throw new NotFoundException('Catalog entry not found');
        return entry;
    }

    private toDto(entry: GroupBook, groupId: string): CatalogEntryDto {
        return {
            id: entry.id,
            groupId,
            book: this.booksService.toDto(entry.book),
            isVisible: entry.isVisible,
            addedAt: entry.addedAt,
        };
    }
}
