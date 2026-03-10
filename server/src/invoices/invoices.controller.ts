import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, Request,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiParam,
} from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/create-invoice.dto';

@ApiTags('Invoices')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  // ── POST /invoices ────────────────────────────────────────────────────────
  @Post()
  @ApiOperation({ summary: 'Create a new invoice (number auto-generated)' })
  create(@Body() dto: CreateInvoiceDto, @Request() req) {
    return this.invoicesService.create(dto, req.user._id);
  }

  // ── GET /invoices ─────────────────────────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'List invoices with optional filters & pagination' })
  @ApiQuery({ name: 'status',     required: false, enum: ['draft','sent','paid','overdue','cancelled'] })
  @ApiQuery({ name: 'clientName', required: false })
  @ApiQuery({ name: 'page',       required: false, type: Number })
  @ApiQuery({ name: 'limit',      required: false, type: Number })
  findAll(
    @Query('status')     status?: string,
    @Query('clientName') clientName?: string,
    @Query('page')       page?: number,
    @Query('limit')      limit?: number,
  ) {
    return this.invoicesService.findAll({ status, clientName, page, limit });
  }

  // ── GET /invoices/stats ───────────────────────────────────────────────────
  @Get('stats')
  @ApiOperation({ summary: 'Revenue stats, status breakdown, recent invoices' })
  stats() {
    return this.invoicesService.stats();
  }

  // ── GET /invoices/number/:invoiceNumber ───────────────────────────────────
  @Get('number/:invoiceNumber')
  @ApiOperation({ summary: 'Find invoice by invoice number (e.g. INV-2026-0001)' })
  @ApiParam({ name: 'invoiceNumber' })
  findByNumber(@Param('invoiceNumber') invoiceNumber: string) {
    return this.invoicesService.findByNumber(invoiceNumber);
  }

  // ── GET /invoices/:id ─────────────────────────────────────────────────────
  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by MongoDB ID' })
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  // ── PUT /invoices/:id ─────────────────────────────────────────────────────
  @Put(':id')
  @ApiOperation({ summary: 'Full update of an invoice (totals recomputed)' })
  update(@Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
    return this.invoicesService.update(id, dto);
  }

  // ── PATCH /invoices/:id/status ────────────────────────────────────────────
  @Patch(':id/status')
  @ApiOperation({ summary: 'Quick status change (draft→sent→paid etc.)' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.invoicesService.update(id, { status } as UpdateInvoiceDto);
  }

  // ── PATCH /invoices/:id/pay ───────────────────────────────────────────────
  @Patch(':id/pay')
  @ApiOperation({ summary: 'Record payment — marks as paid if fully settled' })
  markPaid(
    @Param('id') id: string,
    @Body('amountPaid') amountPaid?: number,
  ) {
    return this.invoicesService.markPaid(id, amountPaid);
  }

  // ── DELETE /invoices/:id ──────────────────────────────────────────────────
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an invoice' })
  remove(@Param('id') id: string) {
    return this.invoicesService.remove(id);
  }
}