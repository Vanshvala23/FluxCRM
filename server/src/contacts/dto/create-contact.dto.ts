import { IsEmail, IsNotEmpty, IsOptional, IsEnum, IsMongoId, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateContactDto {
  @ApiProperty() @IsNotEmpty() firstName: string;
  @ApiProperty() @IsNotEmpty() lastName: string;
  @ApiProperty() @IsEmail() email: string;
  @ApiPropertyOptional() @IsOptional() phone?: string;
  @ApiPropertyOptional() @IsOptional() company?: string;
  @ApiPropertyOptional() @IsOptional() jobTitle?: string;
  @ApiPropertyOptional() @IsOptional() notes?: string;

  @ApiPropertyOptional({ type: [String], description: 'Array of Group IDs' })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  groups?: string[];
}

export class UpdateContactDto extends CreateContactDto {}