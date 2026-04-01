import {
  Controller, Get, Post, Delete,
  Param, Body, Res, UseGuards,
  UseInterceptors, UploadedFiles,
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

  @Post('export')
  export(@Body() dto: CreateBulkPdfDto) {
    return this.bulkPdfService.exportAndStore(dto);
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const pdf = await this.bulkPdfService.download(id);
    const raw = pdf.data as any;

    let buffer: Buffer;

    if (Buffer.isBuffer(raw)) {
      // Already a plain Node.js Buffer
      buffer = raw;
    } else if (raw?._bsontype === 'Binary') {
      // BSON Binary — .value(true) returns a Buffer directly
      buffer = Buffer.from(raw.value(true));
    } else if (raw?.buffer instanceof ArrayBuffer) {
      // Uint8Array wrapping an ArrayBuffer
      buffer = Buffer.from(raw.buffer);
    } else {
      // Last resort: stringify to base64 then decode
      buffer = Buffer.from(Buffer.from(raw).toString('base64'), 'base64');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pdf.originalName}"`);
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  }

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 20, { storage: memoryStorage() }))
  upload(
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