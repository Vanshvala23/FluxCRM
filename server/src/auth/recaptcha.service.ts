import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class RecaptchaService {
  private readonly secretKey: string;
  private readonly threshold: number = 0.5;

  constructor(private configService: ConfigService) {
    this.secretKey = this.configService.get<string>('RECAPTCHA_SECRET_KEY')!;
  }

  async verify(token: string, action?: string): Promise<void> {
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

      const { success, score, action: returnedAction, 'error-codes': errorCodes } = response.data;

      if (!success) {
        console.error('reCAPTCHA failed:', errorCodes);
        throw new BadRequestException('reCAPTCHA verification failed');
      }

      // v3 score check (0.0 = bot, 1.0 = human)
      if (score !== undefined && score < this.threshold) {
        throw new BadRequestException(`reCAPTCHA score too low: ${score}`);
      }

      // Optional action check
      if (action && returnedAction && returnedAction !== action) {
        throw new BadRequestException('reCAPTCHA action mismatch');
      }
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('reCAPTCHA service unreachable');
    }
  }
}