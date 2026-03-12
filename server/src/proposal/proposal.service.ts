import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Proposal, ProposalDocument } from './schemas/proposal.schema';
import { CreateProposalDto, UpdateProposalDto, ProposalQueryDto } from './dto/create-proposal.dto';
import { ItemsService } from '../items/items.service';
import { ItemLineDto } from '../items/dto/create-item.dto';

@Injectable()
export class ProposalsService {
  constructor(
    @InjectModel(Proposal.name)
    private proposalModel: Model<ProposalDocument>,
    private readonly itemsService: ItemsService,
  ) {}

  // ── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Resolve line items from either source:
   *  - dto.itemLines  → catalogue references → resolved via ItemsService
   *  - dto.items      → raw ProposalItemDto  → normalised as-is
   * itemLines takes priority when both are present.
   */
  private async resolveRawLines(
    dto: CreateProposalDto | UpdateProposalDto,
  ): Promise<any[]> {
    if (dto.itemLines?.length) {
      const resolved = await this.itemsService.resolveLines(
        dto.itemLines as ItemLineDto[],
      );
      // Map ItemsService shape → proposal line shape
      // FIX: include `name` field required by the Proposal subdocument schema
      return resolved.map((r) => ({
        name:         r.name ?? r.description,
        description:  r.description,
        quantity:     r.quantity,
        unitPrice:    r.unitPrice,
        tax:          r.taxRate,
        discount:     r.discountRate,
        amount:       r.amount,
      }));
    }

    // Raw items — normalise to the same shape
    // FIX: include `name` field required by the Proposal subdocument schema
    return (dto.items || []).map((item: any) => {
      const base   = item.quantity * item.unitPrice;
      const amount = Math.round(base * 100) / 100;
      return {
        name:        item.name ?? item.description,
        description: item.description ?? item.name,
        quantity:    item.quantity,
        unitPrice:   item.unitPrice,
        tax:         0,
        discount:    0,
        amount,
      };
    });
  }

  /**
   * Sum per-item amounts, then apply global taxPercent / discountPercent on top.
   * Returns the final `amount` stored on the proposal document.
   */
  private computeFinalAmount(
    lines: any[],
    taxPercent = 0,
    discountPercent = 0,
  ): {
    subtotal:      number;
    totalTax:      number;
    totalDiscount: number;
    total:         number;
  } {
    // Per-item totals (already computed by resolveRawLines / ItemsService)
    const lineTotal = lines.reduce((sum, l) => sum + (l.amount ?? 0), 0);

    // Global discount applied on top of line total
    const globalDiscountAmt = lineTotal * (discountPercent / 100);
    const afterDiscount     = lineTotal - globalDiscountAmt;

    // Global tax applied after global discount
    const globalTaxAmt = afterDiscount * (taxPercent / 100);
    const total        = afterDiscount + globalTaxAmt;

    const r = (n: number) => Math.round(n * 100) / 100;
    return {
      subtotal:      r(lineTotal),
      totalTax:      r(globalTaxAmt),
      totalDiscount: r(globalDiscountAmt),
      total:         r(total),
    };
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async create(dto: CreateProposalDto, userId: string): Promise<ProposalDocument> {
    const rawLines = await this.resolveRawLines(dto);
    const { subtotal, totalTax, totalDiscount, total } = this.computeFinalAmount(
      rawLines,
      dto.taxPercent,
      dto.discountPercent,
    );

    const proposal = await new this.proposalModel({
      ...dto,
      items:         rawLines,
      subtotal,
      totalTax,
      totalDiscount,
      // Honour explicit amount override; otherwise use computed total
      amount:        dto.amount ?? total,
      createdBy:     new Types.ObjectId(userId),
    }).save();

    // Track usage — link each catalogue item back to this proposal
    if (dto.itemLines?.length) {
      await Promise.all(
        dto.itemLines.map((line) =>
          this.itemsService.linkToProposal(line.itemId, String(proposal._id)),
        ),
      );
    }

    return proposal;
  }

  async findAll(query: ProposalQueryDto) {
    const { status, contact, lead, search, page = 1, limit = 20 } = query;

    const filter: Record<string, any> = {};
    if (status)  filter.status  = status;
    if (contact) filter.contact = new Types.ObjectId(contact);
    if (lead)    filter.lead    = new Types.ObjectId(lead);
    if (search) {
      filter.$or = [
        { title:       { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      this.proposalModel
        .find(filter)
        .populate('contact',   'name email phone')
        .populate('lead',      'title status value')
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
      page:       Number(page),
      limit:      Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    };
  }

  async findOne(id: string): Promise<ProposalDocument> {
    this.validateObjectId(id);
    const proposal = await this.proposalModel
      .findById(id)
      .populate('contact',   'name email phone company')
      .populate('lead',      'title status value')
      .populate('createdBy', 'name email');

    if (!proposal) throw new NotFoundException(`Proposal ${id} not found`);
    return proposal;
  }

  async update(id: string, dto: UpdateProposalDto): Promise<ProposalDocument> {
    this.validateObjectId(id);
    const proposal = await this.proposalModel.findById(id);
    if (!proposal) throw new NotFoundException(`Proposal ${id} not found`);

    // Prevent editing accepted/rejected proposals (guard skipped for status-only updates)
    if (['accepted', 'rejected'].includes(proposal.status) && dto.status === undefined) {
      throw new BadRequestException(
        `Cannot edit a proposal that is already ${proposal.status}`,
      );
    }

    // Re-resolve lines only when new items/itemLines are supplied
    if (dto.itemLines?.length || dto.items?.length) {
      const rawLines = await this.resolveRawLines(dto);
      const taxPercent      = dto.taxPercent      ?? proposal.taxPercent      ?? 0;
      const discountPercent = dto.discountPercent ?? proposal.discountPercent ?? 0;
      const { subtotal, totalTax, totalDiscount, total } =
        this.computeFinalAmount(rawLines, taxPercent, discountPercent);

      dto = {
        ...dto,
        items:         rawLines as any,
        subtotal,
        totalTax,
        totalDiscount,
        amount:        (dto as any).amount ?? total,
      } as UpdateProposalDto;

      // Re-link catalogue items if itemLines were updated
      if (dto.itemLines?.length) {
        await Promise.all(
          dto.itemLines.map((line) =>
            this.itemsService.linkToProposal(line.itemId, id),
          ),
        );
      }
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

  // ── Status transitions ────────────────────────────────────────────────────

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
    proposal.status      = action;
    proposal.respondedAt = new Date();
    return proposal.save();
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  async getStats() {
    const statusStats = await this.proposalModel.aggregate([
      {
        $group: {
          _id:         '$status',
          count:       { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);

    const revenueWon = await this.proposalModel.aggregate([
      { $match: { status: 'accepted' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const expiringThisWeek = await this.proposalModel.countDocuments({
      status:     { $in: ['sent', 'viewed'] },
      validUntil: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      byStatus:         statusStats,
      revenueWon:       revenueWon[0]?.total || 0,
      expiringThisWeek,
    };
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private validateObjectId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ID: ${id}`);
    }
  }
}