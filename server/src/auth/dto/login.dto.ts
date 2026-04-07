import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'secret123' })
  @IsNotEmpty()
  password!: string;

  @ApiProperty({ example: 'recaptcha_token_from_frontend' })
  @IsString()
  @IsNotEmpty()
  recaptchaToken!: string;
}