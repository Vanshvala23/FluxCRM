import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class RecaptchaService {
  private readonly secretKey: string;

  constructor(private configService: ConfigService) {
    this.secretKey = this.configService.get<string>('RECAPTCHA_SECRET_KEY')!;
  }

  async verify(token: string): Promise<void> { // ✅ no action param for v2
    if (!token) {
      throw new BadRequestException('reCAPTCHA token is required');
    }

    try {
      const response = await axios.post(
        'https://www.google.com/recaptcha/api/siteverify',
        null,
        {
          params: {
            secret: this.secretKey,
            response: token,
          },
        },
      );

      const { success, 'error-codes': errorCodes } = response.data;

      if (!success) {
        console.error('reCAPTCHA failed:', errorCodes);
        throw new BadRequestException('reCAPTCHA verification failed');
      }
      // ✅ No score check for v2 — success=true is enough
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('reCAPTCHA service unreachable');
    }
  }
}