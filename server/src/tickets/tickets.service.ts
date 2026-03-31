import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ticket, TicketDocument } from './schemas/ticket.schema';

@Injectable()
export class TicketsService {
  constructor(@InjectModel(Ticket.name) private model: Model<TicketDocument>) {}

  create(dto: any, userId: string) {
    return this.model.create({ ...dto, createdBy: userId });
  }

  findAll(query: any = {}) {
    const filter: any = {};

    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;
    if (query.search) filter.title = new RegExp(query.search, 'i');

    return this.model
      .find(filter)
      .populate('assignedTo', 'name email')
      .populate('contact', 'firstName lastName email')
      .sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    const doc = await this.model
      .findById(id)
      .populate('assignedTo', 'name email')
      .populate('contact', 'firstName lastName email');

    if (!doc) throw new NotFoundException('Ticket not found');
    return doc;
  }

  async update(id: string, dto: any) {
    const doc = await this.model.findByIdAndUpdate(id, dto, { new: true });
    if (!doc) throw new NotFoundException('Ticket not found');
    return doc;
  }

  // 💬 ADD REPLY
  async addReply(
    id: string,
    userId: string,
    message: string,
    sender: 'admin' | 'user' = 'admin'
  ) {
    const doc = await this.model.findByIdAndUpdate(
      id,
      {
        $push: {
          replies: {
            message,
            sender,
            user: userId,
            createdAt: new Date(),
          },
        },
        $set: { status: 'in-progress' }, // auto update
      },
      { new: true }
    );

    if (!doc) throw new NotFoundException('Ticket not found');
    return doc;
  }

  // 🌍 PUBLIC TICKETS
  async getPublicTickets() {
    return this.model
      .find({ isPublic: true })
      .populate('contact', 'firstName lastName email')
      .sort({ createdAt: -1 });
  }

  // 🔘 TOGGLE PUBLIC
  async togglePublic(id: string) {
    const ticket = await this.model.findById(id);
    if (!ticket) throw new NotFoundException('Ticket not found');

    ticket.isPublic = !ticket.isPublic;
    return ticket.save();
  }

  async remove(id: string) {
    await this.model.findByIdAndDelete(id);
    return { message: 'Ticket deleted' };
  }
}