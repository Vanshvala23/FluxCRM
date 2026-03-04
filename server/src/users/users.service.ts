import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  // Used by UsersController
  async create(dto: CreateUserDto): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) throw new ConflictException('Email already in use');
    const hashed = await bcrypt.hash(dto.password, 10);
    return this.userModel.create({ ...dto, password: hashed });
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().select('-password');
  }

  async findOne(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).select('-password');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserDocument> {
    // Hash password if it's being updated
    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }
    const user = await this.userModel
      .findByIdAndUpdate(id, dto, { new: true })
      .select('-password');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async remove(id: string): Promise<{ message: string }> {
    const user = await this.userModel.findByIdAndDelete(id);
    if (!user) throw new NotFoundException('User not found');
    return { message: 'User deleted successfully' };
  }

  // Used internally by AuthService
  async createFromAuth(name: string, email: string, password: string): Promise<UserDocument> {
    const hashed = await bcrypt.hash(password, 10);
    return this.userModel.create({ name, email, password: hashed });
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email });
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).select('-password');
  }
}