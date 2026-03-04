import {
  IsString, IsOptional, IsEnum, IsNumber, IsArray,
  IsDateString, IsMongoId, Min, Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

// ─── Create ──────────────────────────────────────────────────────────────────

export class CreateProjectDto {
  @ApiProperty({ example: 'FluxCRM Website Redesign' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ['planning', 'active', 'on_hold', 'completed', 'cancelled'], default: 'planning' })
  @IsOptional()
  @IsEnum(['planning', 'active', 'on_hold', 'completed', 'cancelled'])
  status?: string;

  @ApiPropertyOptional({ enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  priority?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  client?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  manager?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  members?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  spent?: number;

  @ApiPropertyOptional({ default: 'INR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

// ─── Update ──────────────────────────────────────────────────────────────────

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

// ─── Query / Filter ──────────────────────────────────────────────────────────

export class ProjectQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['planning', 'active', 'on_hold', 'completed', 'cancelled'] })
  @IsOptional()
  @IsEnum(['planning', 'active', 'on_hold', 'completed', 'cancelled'])
  status?: string;

  @ApiPropertyOptional({ enum: ['low', 'medium', 'high', 'urgent'] })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  priority?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  client?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  manager?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}