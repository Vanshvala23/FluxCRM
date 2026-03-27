import {
  IsOptional, IsString, IsEnum,
  IsDateString, IsArray,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export type ExportType = 'invoices' | 'proposals';

export class CreateBulkPdfDto {
  @ApiPropertyOptional({ example: 'invoices', enum: ['invoices', 'proposals'] })
  @IsOptional()
  @IsEnum(['invoices', 'proposals'])
  type?: ExportType;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ example: ['urgent', 'q1'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: 'Q1 Invoices batch' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsString()
  uploadedBy?: string;
}