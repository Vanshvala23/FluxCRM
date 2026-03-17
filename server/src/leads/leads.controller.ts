import {
  Controller, Get, Post, Body, Param, Put, Delete,
  UseGuards, Request, Query, Res, UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiQuery, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type{ Response } from 'express';
import { LeadsService } from './leads.service';

@ApiTags('Leads')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('leads')
export class LeadsController {
  constructor(private service: LeadsService) {}

  @Post()
  create(@Body() dto: any, @Request() req) {
    return this.service.create(dto, req.user.userId);
  }

  @Get()
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'] })
  findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Aggregate lead counts and values by status' })
  getStats() {
    return this.service.getStats();
  }

  // ── Import routes must be declared before :id ────────────────────────────

  @Get('import/sample')
  @ApiOperation({ summary: 'Download sample CSV for lead import' })
  downloadSample(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="leads_sample.csv"');
    res.send(this.service.getSampleCsv());
  }

  @Post('import')
  @ApiOperation({ summary: 'Import leads from CSV (simulate=true for dry run)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiQuery({ name: 'simulate', required: false, type: Boolean })
  @UseInterceptors(FileInterceptor('file'))
  importLeads(
    @UploadedFile() file: Express.Multer.File,
    @Query('simulate') simulate: string,
    @Request() req,
  ) {
    return this.service.importLeads(file.buffer, req.user.userId, simulate === 'true');
  }

  // ── Param routes ─────────────────────────────────────────────────────────

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}