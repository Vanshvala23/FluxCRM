import {
  Controller, Get, Post, Delete,
  Param, Body, Res, UseGuards,
  UseInterceptors, UploadedFiles,
  BadRequestException,
} from '@nestjs/common';

import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';

import { BulkPdfService } from './bulk-pdf.service';
import { CreateBulkPdfDto } from './dto/create-bulk-pdf.dto';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('bulk-pdf')
export class BulkPdfController {
  constructor(private readonly bulkPdfService: BulkPdfService) {}

  // ✅ EXPORT (store only)
  @Post('export')
  async export(@Body() dto: CreateBulkPdfDto) {
    return this.bulkPdfService.exportAndStore(dto);
  }

  // ✅ DOWNLOAD
  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const pdf = await this.bulkPdfService.download(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${pdf.originalName}"`,
    );
    res.setHeader('Content-Length', pdf.size);

    return res.end(pdf.data);
  }

  // ✅ UPLOAD
  @Post('upload')
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage: memoryStorage(),
    }),
  )
  async upload(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: CreateBulkPdfDto,
  ) {
    return this.bulkPdfService.uploadMany(files, dto);
  }

  @Get()
  findAll() {
    return this.bulkPdfService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bulkPdfService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bulkPdfService.remove(id);
  }

  @Delete()
  removeAll() {
    return this.bulkPdfService.removeAll();
  }
}