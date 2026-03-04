import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(name: string, email: string, password: string) {
  const existing = await this.usersService.findByEmail(email);
  if (existing) throw new ConflictException('Email already in use');

  // ✅ Use createFromAuth instead of create to avoid DTO mismatch
  const user = await this.usersService.createFromAuth(name, email, password);
  const token = this.jwtService.sign({ sub: user._id, email: user.email, role: user.role });
  return { 
    access_token: token, 
    user: { id: user._id, name: user.name, email: user.email, role: user.role } 
  };
}

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password)))
      throw new UnauthorizedException('Invalid credentials');
    const token = this.jwtService.sign({ sub: user._id, email: user.email, role: user.role });
    return { access_token: token, user: { id: user._id, name: user.name, email: user.email, role: user.role } };
  }

  async getProfile(userId: string) {
    return this.usersService.findById(userId);
  }
}