import {
  IsString, IsNotEmpty, IsOptional,
  IsEnum, IsNumber, IsMongoId, Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  invoice!: string;

  @ApiProperty({ example: 3946.00 })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({ enum: ['bank', 'cash', 'cheque', 'credit_card', 'upi', 'other'], default: 'bank' })
  @IsEnum(['bank', 'cash', 'cheque', 'credit_card', 'upi', 'other'])
  paymentMode!: string;

  @ApiProperty({ example: '2026-04-08' })
  @IsString()
  @IsNotEmpty()
  paymentDate!: string;

  @ApiPropertyOptional({ example: 'TXN123456' })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({ example: 'Payment for April services' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: 'INR' })
  @IsOptional()
  @IsString()
  currency?: string;
}