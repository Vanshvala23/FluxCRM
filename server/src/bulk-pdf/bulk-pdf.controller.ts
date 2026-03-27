import {
  Controller, Get, Post, Delete,
  Param, Body, Res, UseGuards,
  UseInterceptors, UploadedFiles,
  BadRequestException,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
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

  // ─── EXPORT PDF ─────────────────────────────────────────
  @Post('export')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate merged PDF from records (invoices/proposals)',
  })
  @ApiResponse({ status: 201, description: 'PDF generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid filters / No records found' })
  async export(@Body() dto: CreateBulkPdfDto) {
    if (!dto.type) {
      throw new BadRequestException('Type is required (invoices/proposals)');
    }

    return this.bulkPdfService.exportAndStore(dto);
  }

  // ─── UPLOAD PDF FILES ───────────────────────────────────
  @Post('upload')
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
          return cb(
            new BadRequestException('Only PDF files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  @ApiOperation({ summary: 'Upload PDF files and store in MongoDB' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        description: { type: 'string' },
        uploadedBy: { type: 'string' },
      },
    },
  })
  async upload(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: CreateBulkPdfDto,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No PDF files uploaded');
    }

    return this.bulkPdfService.uploadMany(files, dto);
  }

  // ─── LIST ALL PDFs ─────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'Get all stored PDFs (metadata only)' })
  async findAll() {
    return this.bulkPdfService.findAll();
  }

  // ─── GET SINGLE PDF METADATA ───────────────────────────
  @Get(':id')
  @ApiOperation({ summary: 'Get PDF metadata by ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId' })
  async findOne(@Param('id') id: string) {
    return this.bulkPdfService.findOne(id);
  }

  // ─── DOWNLOAD PDF (FIXED) ──────────────────────────────
  @Get(':id/download')
  @ApiOperation({ summary: 'Download PDF file' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId' })
  async download(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const pdf = await this.bulkPdfService.download(id);

    if (!pdf?.data) {
      throw new BadRequestException('Invalid PDF data');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${pdf.originalName}"`,
    );
    res.setHeader('Content-Length', pdf.size);

    return res.end(pdf.data); // ✅ FIX (important)
  }

  // ─── DELETE ONE ────────────────────────────────────────
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a PDF by ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId' })
  async remove(@Param('id') id: string) {
    return this.bulkPdfService.remove(id);
  }

  // ─── DELETE ALL ────────────────────────────────────────
  @Delete()
  @ApiOperation({ summary: 'Delete all PDFs' })
  async removeAll() {
    return this.bulkPdfService.removeAll();
  }
}