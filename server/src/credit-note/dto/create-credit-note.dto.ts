import {
  IsString, IsNotEmpty, IsOptional, IsEnum, IsArray,
  IsNumber, Min, Max, ValidateNested, IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddressDto {
  @ApiPropertyOptional() @IsOptional() @IsString() line1?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() line2?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() state?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() zip?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() country?: string;
}

export class LineItemDto {
  @ApiProperty({ example: 'MacBook Pro' })
    @IsString() @IsNotEmpty()
    item!: string;

  @ApiPropertyOptional({ example: '16-inch, M3 Pro' })
  @IsOptional() @IsString() description?: string;

  @ApiProperty({ example: 1 })
    @IsNumber() @Min(0)
    qty!: number;

  @ApiProperty({ example: 2150 })
    @IsNumber() @Min(0)
    rate!: number;

  @ApiPropertyOptional({ enum: [5, 10, 18], example: 10 })
  @IsOptional() @IsIn([5, 10, 18, null]) tax?: number | null;
}

export class CreateCreditNoteDto {
  @ApiProperty({ example: 'Acme Corp' })
    @IsString() @IsNotEmpty()
    customer!: string;

  @ApiPropertyOptional({ type: AddressDto })
  @IsOptional() @ValidateNested() @Type(() => AddressDto) billTo?: AddressDto;

  @ApiPropertyOptional({ type: AddressDto })
  @IsOptional() @ValidateNested() @Type(() => AddressDto) shipTo?: AddressDto;

  @ApiProperty({ example: '2024-01-15' })
    @IsString() @IsNotEmpty()
    creditNoteDate!: string;

  @ApiProperty({ example: 'CN-0001' })
    @IsString() @IsNotEmpty()
    creditNoteNumber!: string;

  @ApiProperty({ enum: ['USD', 'EUR'], default: 'USD' })
    @IsEnum(['USD', 'EUR'])
    currency!: 'USD' | 'EUR';

  @ApiProperty({ enum: ['no_discount', 'before_tax', 'after_tax'], default: 'no_discount' })
    @IsEnum(['no_discount', 'before_tax', 'after_tax'])
    discountType!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() referenceNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() adminNote?: string;

  @ApiProperty({ type: [LineItemDto] })
    @IsArray() @ValidateNested({ each: true }) @Type(() => LineItemDto)
    items!: LineItemDto[];

  @ApiProperty({ enum: ['qty', 'hours', 'qty_hours'], default: 'qty' })
    @IsEnum(['qty', 'hours', 'qty_hours'])
    showQuantityAs!: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional() @IsNumber() @Min(0) @Max(100) discountPercent?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional() @IsNumber() adjustment?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() clientNote?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() termsAndConditions?: string;
}