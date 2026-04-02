import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Group, GroupDocument } from './schemas/group-schema';
import { CreateGroupDto } from './dto/create-group.dto';

@Injectable()
export class GroupService {
  constructor(
    @InjectModel(Group.name)
    private readonly groupModel: Model<GroupDocument>,
  ) {}

  async create(dto: CreateGroupDto): Promise<GroupDocument> {
    try {
      return await this.groupModel.create(dto);
    } catch (err: any) {
      if (err.code === 11000) throw new ConflictException(`Group "${dto.name}" already exists`);
      throw err;
    }
  }

  findAll(): Promise<GroupDocument[]> {
    return this.groupModel.find().sort({ name: 1 }).exec();
  }

  async findOne(id: string): Promise<GroupDocument> {
    const group = await this.groupModel.findById(id).exec();
    if (!group) throw new NotFoundException(`Group #${id} not found`);
    return group;
  }

  async update(id: string, dto: Partial<CreateGroupDto>): Promise<GroupDocument> {
    const group = await this.groupModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!group) throw new NotFoundException(`Group #${id} not found`);
    return group;
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.groupModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException(`Group #${id} not found`);
    return { message: `Group "${result.name}" deleted` };
  }
}