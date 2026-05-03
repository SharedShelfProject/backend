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
import {CatalogService} from './catalog.service';
import {CatalogEntryDto} from "./dto/catalog-entry.dto";
import {AddBookToCatalogDto} from "./dto/add-book-to-catalog.dto";
import {UpdateCatalogEntryDto} from "./dto/update-catalog-entry.dto";

@ApiTags('catalog')
@Controller('groups/:groupId/catalog')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CatalogController {
    constructor(private readonly catalogService: CatalogService) {
    }

    @Get()
    @ApiOperation({summary: 'Get group catalog'})
    @ApiParam({name: 'groupId', description: 'Group UUID'})
    @ApiResponse({status: 200, type: [CatalogEntryDto]})
    getCatalog(
        @Param('groupId') groupId: string,
        @CurrentUser() user: { id: string },
    ): Promise<CatalogEntryDto[]> {
        return this.catalogService.getCatalog(groupId, user.id);
    }

    @Post()
    @ApiOperation({summary: 'Add own book to group catalog'})
    @ApiParam({name: 'groupId', description: 'Group UUID'})
    @ApiResponse({status: 201, type: CatalogEntryDto})
    addBook(
        @Param('groupId') groupId: string,
        @CurrentUser() user: { id: string },
        @Body() dto: AddBookToCatalogDto,
    ): Promise<CatalogEntryDto> {
        return this.catalogService.addBook(groupId, user.id, dto);
    }

    @Patch(':entryId')
    @ApiOperation({summary: 'Update catalog entry visibility (book owner or admin)'})
    @ApiParam({name: 'groupId', description: 'Group UUID'})
    @ApiParam({name: 'entryId', description: 'Catalog entry UUID'})
    @ApiResponse({status: 200, type: CatalogEntryDto})
    updateEntry(
        @Param('groupId') groupId: string,
        @Param('entryId') entryId: string,
        @CurrentUser() user: { id: string },
        @Body() dto: UpdateCatalogEntryDto,
    ): Promise<CatalogEntryDto> {
        return this.catalogService.updateEntry(groupId, entryId, user.id, dto);
    }

    @Delete(':entryId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({summary: 'Remove book from group catalog (book owner or admin)'})
    @ApiParam({name: 'groupId', description: 'Group UUID'})
    @ApiParam({name: 'entryId', description: 'Catalog entry UUID'})
    @ApiResponse({status: 204})
    removeBook(
        @Param('groupId') groupId: string,
        @Param('entryId') entryId: string,
        @CurrentUser() user: { id: string },
    ): Promise<void> {
        return this.catalogService.removeBook(groupId, entryId, user.id);
    }
}
