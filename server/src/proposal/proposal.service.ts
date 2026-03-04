import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Proposal, ProposalDocument } from './schemas/proposal.schema';
import { CreateProposalDto, UpdateProposalDto, ProposalQueryDto } from './dto/create-proposal.dto';

@Injectable()
export class ProposalsService {
  constructor(
    @InjectModel(Proposal.name)
    private proposalModel: Model<ProposalDocument>,
  ) {}

  async create(dto: CreateProposalDto, userId: string): Promise<ProposalDocument> {
    const proposal = new this.proposalModel({
      ...dto,
      createdBy: new Types.ObjectId(userId),
    });
    return proposal.save();
  }

  async findAll(query: ProposalQueryDto) {
    const {
      status,
      contact,
      lead,
      search,
      page = 1,
      limit = 20,
    } = query;

    const filter: Record<string, any> = {};

    if (status) filter.status = status;
    if (contact) filter.contact = new Types.ObjectId(contact);
    if (lead) filter.lead = new Types.ObjectId(lead);
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      this.proposalModel
        .find(filter)
        .populate('contact', 'name email phone')
        .populate('lead', 'title status value')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      this.proposalModel.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    };
  }

  async findOne(id: string): Promise<ProposalDocument> {
    this.validateObjectId(id);
    const proposal = await this.proposalModel
      .findById(id)
      .populate('contact', 'name email phone company')
      .populate('lead', 'title status value')
      .populate('createdBy', 'name email');

    if (!proposal) throw new NotFoundException(`Proposal ${id} not found`);
    return proposal;
  }

  async update(id: string, dto: UpdateProposalDto): Promise<ProposalDocument> {
    this.validateObjectId(id);
    const proposal = await this.proposalModel.findById(id);
    if (!proposal) throw new NotFoundException(`Proposal ${id} not found`);

    // Prevent editing accepted/rejected proposals (optional guard)
    if (['accepted', 'rejected'].includes(proposal.status) && dto.status === undefined) {
      throw new BadRequestException(
        `Cannot edit a proposal that is already ${proposal.status}`,
      );
    }

    Object.assign(proposal, dto);
    return proposal.save();
  }

  async remove(id: string): Promise<{ message: string }> {
    this.validateObjectId(id);
    const result = await this.proposalModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException(`Proposal ${id} not found`);
    return { message: 'Proposal deleted successfully' };
  }

  // Mark as sent — sets sentAt timestamp
  async markSent(id: string): Promise<ProposalDocument> {
    this.validateObjectId(id);
    const proposal = await this.proposalModel.findById(id);
    if (!proposal) throw new NotFoundException(`Proposal ${id} not found`);
    if (proposal.status !== 'draft') {
      throw new BadRequestException('Only draft proposals can be marked as sent');
    }

    proposal.status = 'sent';
    proposal.sentAt = new Date();
    return proposal.save();
  }

  // Mark as viewed
  async markViewed(id: string): Promise<ProposalDocument> {
    this.validateObjectId(id);
    const proposal = await this.proposalModel.findById(id);
    if (!proposal) throw new NotFoundException(`Proposal ${id} not found`);

    if (!proposal.viewedAt) {
      proposal.viewedAt = new Date();
      if (proposal.status === 'sent') proposal.status = 'viewed';
      await proposal.save();
    }
    return proposal;
  }

  // Accept or reject
  async respond(
    id: string,
    action: 'accepted' | 'rejected',
  ): Promise<ProposalDocument> {
    this.validateObjectId(id);
    const proposal = await this.proposalModel.findById(id);
    if (!proposal) throw new NotFoundException(`Proposal ${id} not found`);

    if (!['sent', 'viewed'].includes(proposal.status)) {
      throw new BadRequestException(
        'Only sent or viewed proposals can be accepted/rejected',
      );
    }

    proposal.status = action;
    proposal.respondedAt = new Date();
    return proposal.save();
  }

  // Stats for dashboard
  async getStats() {
    const statusStats = await this.proposalModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);

    const revenueWon = await this.proposalModel.aggregate([
      { $match: { status: 'accepted' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const expiringThisWeek = await this.proposalModel.countDocuments({
      status: { $in: ['sent', 'viewed'] },
      validUntil: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      byStatus: statusStats,
      revenueWon: revenueWon[0]?.total || 0,
      expiringThisWeek,
    };
  }

  private validateObjectId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ID: ${id}`);
    }
  }
}