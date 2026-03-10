import {
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, Query, Request,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags, ApiBearerAuth, ApiOperation,
  ApiQuery, ApiParam, ApiBody,
} from '@nestjs/swagger';
import { ItemsService } from './items.service';
import { CreateItemDto, UpdateItemDto, ItemLineDto } from './dto/create-item.dto';

@ApiTags('Items')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  // ── POST /items ───────────────────────────────────────────────────────────
  @Post()
  @ApiOperation({ summary: 'Create a catalogue item (product or service)' })
  create(@Body() dto: CreateItemDto, @Request() req) {
    return this.itemsService.create(dto, req.user._id);
  }

  // ── GET /items ────────────────────────────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'List items with search, type, category & pagination filters' })
  @ApiQuery({ name: 'search',   required: false })
  @ApiQuery({ name: 'type',     required: false, enum: ['product', 'service'] })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'isActive', required: false, enum: ['true', 'false'] })
  @ApiQuery({ name: 'page',     required: false, type: Number })
  @ApiQuery({ name: 'limit',    required: false, type: Number })
  findAll(
    @Query('search')   search?: string,
    @Query('type')     type?: string,
    @Query('category') category?: string,
    @Query('isActive') isActive?: string,
    @Query('page')     page?: number,
    @Query('limit')    limit?: number,
  ) {
    return this.itemsService.findAll({ search, type, category, isActive, page, limit });
  }

  // ── GET /items/stats ──────────────────────────────────────────────────────
  @Get('stats')
  @ApiOperation({ summary: 'Item stats: counts by type, category, most-used items' })
  stats() {
    return this.itemsService.stats();
  }

  // ── POST /items/resolve-lines ─────────────────────────────────────────────
  @Post('resolve-lines')
  @ApiOperation({
    summary: 'Resolve catalogue items into computed invoice/proposal line objects',
    description:
      'Pass an array of { itemId, quantity, optional overrides }. ' +
      'Returns fully computed lines with amounts ready to embed in an Invoice or Proposal.',
  })
  @ApiBody({ type: [ItemLineDto] })
  resolveLines(@Body() lines: ItemLineDto[]) {
    return this.itemsService.resolveLines(lines);
  }

  // ── GET /items/:id ────────────────────────────────────────────────────────
  @Get(':id')
  @ApiOperation({ summary: 'Get single item with usage in invoices & proposals' })
  findOne(@Param('id') id: string) {
    return this.itemsService.findOne(id);
  }

  // ── PUT /items/:id ────────────────────────────────────────────────────────
  @Put(':id')
  @ApiOperation({ summary: 'Update an item' })
  update(@Param('id') id: string, @Body() dto: UpdateItemDto) {
    return this.itemsService.update(id, dto);
  }

  // ── PATCH /items/:id/toggle ───────────────────────────────────────────────
  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Toggle item active/inactive status' })
  async toggle(@Param('id') id: string) {
    const item = await this.itemsService.findOne(id);
    return this.itemsService.update(id, { isActive: !item.isActive });
  }

  // ── DELETE /items/:id ─────────────────────────────────────────────────────
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an item from the catalogue' })
  remove(@Param('id') id: string) {
    return this.itemsService.remove(id);
  }
}