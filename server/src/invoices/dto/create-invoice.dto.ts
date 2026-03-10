import {
  IsString, IsOptional, IsEnum, IsArray, IsNumber,
  IsEmail, ValidateNested, IsNotEmpty, Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ItemLineDto } from '../../items/dto/create-item.dto';

export class InvoiceItemDto {
  @ApiProperty()  @IsString()  @IsNotEmpty()  description: string;
  @ApiProperty()  @IsNumber()  @Min(0)        quantity: number;
  @ApiProperty()  @IsNumber()  @Min(0)        unitPrice: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) tax?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) discount?: number;
}

export class CreateInvoiceDto {
  /* Client */
  @ApiProperty()           @IsString()  @IsNotEmpty() clientName: string;
  @ApiPropertyOptional()   @IsOptional() @IsEmail()   clientEmail?: string;
  @ApiPropertyOptional()   @IsOptional() @IsString()  clientPhone?: string;
  @ApiPropertyOptional()   @IsOptional() @IsString()  clientAddress?: string;
  @ApiPropertyOptional()   @IsOptional() @IsString()  clientCompany?: string;

  /* CRM links */
  @ApiPropertyOptional()   @IsOptional() @IsString()  contact?: string;
  @ApiPropertyOptional()   @IsOptional() @IsString()  lead?: string;

  /* Dates */
  @ApiProperty()           @IsString()  @IsNotEmpty() issueDate: string;
  @ApiProperty()           @IsString()  @IsNotEmpty() dueDate: string;

  /* Items — pass ONE of these two, not both.
     itemLines = catalogue references (recommended)
     items     = raw embedded line objects (manual entry) */
  @ApiPropertyOptional({
    type: [ItemLineDto],
    description: 'Catalogue item references. Takes priority over `items` when both are sent.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemLineDto)
  itemLines?: ItemLineDto[];

  @ApiPropertyOptional({
    type: [InvoiceItemDto],
    description: 'Raw line items (used when not picking from the catalogue).',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items?: InvoiceItemDto[];

  /* Payment */
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) amountPaid?: number;

  @ApiPropertyOptional({
    enum: ['cash', 'bank_transfer', 'credit_card', 'cheque', 'other'],
  })
  @IsOptional()
  @IsEnum(['cash', 'bank_transfer', 'credit_card', 'cheque', 'other'])
  paymentMethod?: string;

  /* Misc */
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() terms?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() signature?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() assignedTo?: string;

  @ApiPropertyOptional({
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
  })
  @IsOptional()
  @IsEnum(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
  status?: string;
}

export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {}