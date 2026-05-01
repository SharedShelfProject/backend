import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';

import {CurrentUser} from '../auth/decorators/current-user.decorator';
import {JwtAuthGuard} from '../auth/guards/jwt-auth.guard';
import {BooksService} from './books.service';
import {BookDto} from './dto/book.dto';
import {UpdateBookDto} from "./dto/update-book.dto";
import {CreateBookDto} from "./dto/create-book.dto";

@ApiTags('books')
@Controller('books')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BooksController {
    constructor(private readonly booksService: BooksService) {
    }

    @Post()
    @ApiOperation({summary: 'Add a new book to personal collection'})
    @ApiResponse({status: 201, type: BookDto})
    createBook(
        @CurrentUser() user: { id: string },
        @Body() dto: CreateBookDto,
    ): Promise<BookDto> {
        return this.booksService.createBook(user.id, dto);
    }

    @Get('my')
    @ApiOperation({summary: 'Get my books'})
    @ApiResponse({status: 200, type: [BookDto]})
    getMyBooks(@CurrentUser() user: { id: string }): Promise<BookDto[]> {
        return this.booksService.getMyBooks(user.id);
    }

    @Get(':id')
    @ApiOperation({summary: 'Get book by ID'})
    @ApiParam({name: 'id', description: 'Book UUID'})
    @ApiResponse({status: 200, type: BookDto})
    getBook(@Param('id') id: string): Promise<BookDto> {
        return this.booksService.getBookById(id);
    }

    @Patch(':id')
    @ApiOperation({summary: 'Update book details'})
    @ApiParam({name: 'id', description: 'Book UUID'})
    @ApiResponse({status: 200, type: BookDto})
    updateBook(
        @CurrentUser() user: { id: string },
        @Param('id') id: string,
        @Body() dto: UpdateBookDto,
    ): Promise<BookDto> {
        return this.booksService.updateBook(user.id, id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({summary: 'Delete a book from personal collection'})
    @ApiParam({name: 'id', description: 'Book UUID'})
    @ApiResponse({status: 204})
    deleteBook(
        @CurrentUser() user: { id: string },
        @Param('id') id: string,
    ): Promise<void> {
        return this.booksService.deleteBook(user.id, id);
    }
}
