import {
  IsString, IsOptional, IsEnum, IsNumber,
  IsBoolean, IsNotEmpty, Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateItemDto {
  /* Identity */
  @ApiProperty({ example: 'Web Development - Monthly Retainer' })
  @IsString() @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Full-stack web development services billed monthly' })
  @IsOptional() @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'WD-RET-001' })
  @IsOptional() @IsString()
  sku?: string;

  @ApiPropertyOptional({ enum: ['product', 'service'], default: 'service' })
  @IsOptional() @IsEnum(['product', 'service'])
  type?: string;

  /* Pricing */
  @ApiProperty({ example: 2500 })
  @IsNumber() @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional() @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 18, description: 'Default tax rate in %' })
  @IsOptional() @IsNumber() @Min(0)
  taxRate?: number;

  @ApiPropertyOptional({ example: 10, description: 'Default discount rate in %' })
  @IsOptional() @IsNumber() @Min(0)
  discountRate?: number;

  /* Categorisation */
  @ApiPropertyOptional({ example: 'Consulting' })
  @IsOptional() @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'month' })
  @IsOptional() @IsString()
  unit?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional() @IsBoolean()
  isActive?: boolean;
}

export class UpdateItemDto extends PartialType(CreateItemDto) {}

/** Shape returned when an item is picked into an invoice / proposal line */
export class ItemLineDto {
  @ApiProperty()             @IsString() @IsNotEmpty() itemId: string;
  @ApiProperty()             @IsNumber() @Min(0)       quantity: number;
  @ApiPropertyOptional()     @IsOptional() @IsNumber() @Min(0) unitPrice?: number;   // override
  @ApiPropertyOptional()     @IsOptional() @IsNumber() @Min(0) taxRate?: number;     // override
  @ApiPropertyOptional()     @IsOptional() @IsNumber() @Min(0) discountRate?: number;// override
  @ApiPropertyOptional()     @IsOptional() @IsString()         description?: string; // override
}