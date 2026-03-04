import { IsEmail, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateContactDto {
  @ApiProperty() @IsNotEmpty() firstName: string;
  @ApiProperty() @IsNotEmpty() lastName: string;
  @ApiProperty() @IsEmail() email: string;
  @ApiPropertyOptional() @IsOptional() phone?: string;
  @ApiPropertyOptional() @IsOptional() company?: string;
  @ApiPropertyOptional() @IsOptional() jobTitle?: string;
  @ApiPropertyOptional() @IsOptional() notes?: string;
}

export class UpdateContactDto extends CreateContactDto {}