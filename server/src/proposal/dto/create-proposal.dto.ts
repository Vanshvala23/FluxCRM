import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsMongoId,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ItemLineDto } from '../../items/dto/create-item.dto';

export class ProposalItemDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateProposalDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsMongoId()
  contact: string;

  @IsOptional()
  @IsMongoId()
  lead?: string;

  @IsOptional()
  @IsEnum(['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'])
  status?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  /**
   * OPTION A — catalogue references (recommended).
   * Each entry picks an Item from the /items catalogue.
   * Takes priority over `items` when both are supplied.
   * The service calls ItemsService.resolveLines() to expand these
   * into full line objects with computed amounts.
   */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemLineDto)
  itemLines?: ItemLineDto[];

  /**
   * OPTION B — raw / manual line items.
   * Used when the caller is not picking from the catalogue.
   * Ignored when `itemLines` is present.
   */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProposalItemDto)
  items?: ProposalItemDto[];

  /**
   * Global tax % applied to the whole proposal subtotal.
   * Per-item tax comes from the catalogue item's taxRate —
   * this field is for an additional top-level tax layer.
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxPercent?: number;

  /**
   * Global discount % applied to the whole proposal subtotal.
   * Per-item discount comes from the catalogue item's discountRate.
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;   // if omitted, computed from lines + taxPercent + discountPercent

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  terms?: string;
}

export class UpdateProposalDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsMongoId()
  contact?: string;

  @IsOptional()
  @IsMongoId()
  lead?: string;

  @IsOptional()
  @IsEnum(['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'])
  status?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemLineDto)
  itemLines?: ItemLineDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProposalItemDto)
  items?: ProposalItemDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  terms?: string;
}

export class ProposalQueryDto {
  @IsOptional()
  @IsEnum(['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'])
  status?: string;

  @IsOptional()
  @IsMongoId()
  contact?: string;

  @IsOptional()
  @IsMongoId()
  lead?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}