import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Contact, ContactDocument } from './schemas/contact.schema';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactsService {
  constructor(@InjectModel(Contact.name) private model: Model<ContactDocument>) {}

  create(dto: CreateContactDto, userId: string) {
    return this.model.create({ ...dto, assignedTo: userId });
  }

  findAll(query: any = {}) {
    const filter: any = {};
    if (query.search) {
      filter.$or = [
        { firstName: new RegExp(query.search, 'i') },
        { lastName: new RegExp(query.search, 'i') },
        { email: new RegExp(query.search, 'i') },
        { company: new RegExp(query.search, 'i') },
      ];
    }
    if (query.status) filter.status = query.status;
    return this.model.find(filter).populate('assignedTo', 'name email').sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).populate('assignedTo', 'name email');
    if (!doc) throw new NotFoundException('Contact not found');
    return doc;
  }

  async update(id: string, dto: any) {
    const doc = await this.model.findByIdAndUpdate(id, dto, { new: true });
    if (!doc) throw new NotFoundException('Contact not found');
    return doc;
  }

  async remove(id: string) {
    const doc = await this.model.findByIdAndDelete(id);
    if (!doc) throw new NotFoundException('Contact not found');
    return { message: 'Contact deleted' };
  }
}