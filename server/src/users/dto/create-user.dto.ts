// src/users/dto/create-user.dto.ts
import { IsEmail, IsNotEmpty, IsOptional, IsEnum, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'secret123', minLength: 6 })
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: 'agent', enum: ['admin', 'agent'] })
  @IsOptional()
  @IsEnum(['admin', 'agent'])
  role?: string;
}