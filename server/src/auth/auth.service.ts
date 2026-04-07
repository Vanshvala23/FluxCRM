import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { RecaptchaService } from './recaptcha.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private recaptchaService: RecaptchaService,
  ) {}

  async register(name: string, email: string, password: string, recaptchaToken: string) {
    await this.recaptchaService.verify(recaptchaToken); // ✅ no action for v2
    
    const existing = await this.usersService.findByEmail(email);
    if (existing) throw new ConflictException('Email already in use');

    const user = await this.usersService.createFromAuth(name, email, password);
    const token = this.jwtService.sign({ sub: user._id, email: user.email, role: user.role });
    return {
      access_token: token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    };
  }

  async login(email: string, password: string, recaptchaToken: string) {
    await this.recaptchaService.verify(recaptchaToken); // ✅ no action for v2

    const user = await this.usersService.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password)))
      throw new UnauthorizedException('Invalid credentials');

    const token = this.jwtService.sign({ sub: user._id, email: user.email, role: user.role });
    return {
      access_token: token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    };
  }

  async getProfile(userId: string) {
    return this.usersService.findById(userId);
  }
}