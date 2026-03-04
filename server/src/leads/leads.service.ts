import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Lead, LeadDocument } from "./schemas/lead.schema"

@Injectable()
export class LeadsService {
  constructor(@InjectModel(Lead.name) private model: Model<LeadDocument>) {}

  create(dto: any, userId: string) { return this.model.create({ ...dto, assignedTo: userId }); }

  findAll(query: any = {}) {
    const filter: any = {};
    if (query.status) filter.status = query.status;
    if (query.search) filter.$or = [
      { title: new RegExp(query.search, 'i') },
      { contactName: new RegExp(query.search, 'i') },
      { company: new RegExp(query.search, 'i') },
    ];
    return this.model.find(filter).populate('assignedTo', 'name email').sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).populate('assignedTo', 'name email');
    if (!doc) throw new NotFoundException('Lead not found');
    return doc;
  }

  async update(id: string, dto: any) {
    const doc = await this.model.findByIdAndUpdate(id, dto, { new: true });
    if (!doc) throw new NotFoundException('Lead not found');
    return doc;
  }

  async remove(id: string) {
    await this.model.findByIdAndDelete(id);
    return { message: 'Lead deleted' };
  }

  async getStats() {
    return this.model.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, totalValue: { $sum: '$value' } } }
    ]);
  }
}