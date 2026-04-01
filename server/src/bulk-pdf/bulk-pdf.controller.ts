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

  @Post('export')
  async export(@Body() dto: CreateBulkPdfDto) {
    return this.bulkPdfService.exportAndStore(dto);
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const pdf = await this.bulkPdfService.download(id);

    // MongoDB Binary -> plain Buffer conversion
    let buffer: Buffer;
    if (Buffer.isBuffer(pdf.data)) {
      buffer = pdf.data;
    } else if ((pdf.data as any)?.buffer) {
      buffer = Buffer.from((pdf.data as any).buffer);
    } else {
      buffer = Buffer.from(pdf.data as any);
    }

    // Validate PDF header
    if (buffer.length < 5 || !buffer.slice(0, 5).toString('ascii').startsWith('%PDF')) {
      return res.status(500).json({ message: 'Stored binary is not a valid PDF. Re-export and try again.' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pdf.originalName}"`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'no-cache');
    return res.end(buffer);
  }

  @Post('upload')
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
          return cb(new BadRequestException('Only PDF files are allowed'), false);
        }
        cb(null, true);
      },
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