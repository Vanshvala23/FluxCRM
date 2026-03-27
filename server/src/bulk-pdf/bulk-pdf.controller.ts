import {
  Controller, Get, Post, Delete,
  Param, Body, Res, UseGuards,
  UseInterceptors, UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type{ Response } from 'express';
import {
  ApiTags, ApiBearerAuth, ApiOperation,
  ApiConsumes, ApiBody, ApiParam, ApiResponse,
} from '@nestjs/swagger';
import { BulkPdfService } from './bulk-pdf.service';
import { CreateBulkPdfDto } from './dto/create-bulk-pdf.dto';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';

@ApiTags('Bulk PDF')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bulk-pdf')
export class BulkPdfController {
  constructor(private readonly bulkPdfService: BulkPdfService) {}

  // ─── Export records as merged PDF ─────────────────────────────────────────
  @Post('export')
  @ApiOperation({ summary: 'Fetch records by type & date range, generate merged PDF, store in MongoDB' })
  @ApiResponse({ status: 201, description: 'PDF exported and stored successfully' })
  @ApiResponse({ status: 400, description: 'No records found or invalid type' })
  export(@Body() dto: CreateBulkPdfDto) {
    return this.bulkPdfService.exportAndStore(dto);
  }

  // ─── Upload raw PDF files ─────────────────────────────────────────────────
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
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
    }),
  )
  @ApiOperation({ summary: 'Upload raw PDF files and store in MongoDB' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
        description: { type: 'string' },
        uploadedBy: { type: 'string' },
      },
    },
  })
  upload(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: CreateBulkPdfDto,
  ) {
    return this.bulkPdfService.uploadMany(files, dto);
  }

  // ─── List all PDFs (metadata only) ───────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'List all stored PDFs (no binary data)' })
  findAll() {
    return this.bulkPdfService.findAll();
  }

  // ─── Get single PDF metadata ──────────────────────────────────────────────
  @Get(':id')
  @ApiOperation({ summary: 'Get metadata of a single PDF' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId' })
  findOne(@Param('id') id: string) {
    return this.bulkPdfService.findOne(id);
  }

  // ─── Download PDF ─────────────────────────────────────────────────────────
  @Get(':id/download')
  @ApiOperation({ summary: 'Download the PDF binary by ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId' })
  async download(@Param('id') id: string, @Res() res: Response) {
    const pdf = await this.bulkPdfService.download(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${pdf.originalName}"`,
      'Content-Length': pdf.size,
    });
    res.send(pdf.data);
  }

  // ─── Delete one ───────────────────────────────────────────────────────────
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a PDF by ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId' })
  remove(@Param('id') id: string) {
    return this.bulkPdfService.remove(id);
  }

  // ─── Delete all ───────────────────────────────────────────────────────────
  @Delete()
  @ApiOperation({ summary: 'Delete all stored PDFs' })
  removeAll() {
    return this.bulkPdfService.removeAll();
  }
}