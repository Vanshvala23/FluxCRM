import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'secret123', minLength: 6 })
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'recaptcha_token_from_frontend' })
  @IsString()
  @IsNotEmpty()
  recaptchaToken!: string;
}