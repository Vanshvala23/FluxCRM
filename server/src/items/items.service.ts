import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Item, ItemDocument } from './schemas/item-schema';
import { CreateItemDto, UpdateItemDto, ItemLineDto } from './dto/create-item.dto';

@Injectable()
export class ItemsService {
  constructor(
    @InjectModel(Item.name)
    private readonly itemModel: Model<ItemDocument>,
  ) {}

  // ── CRUD ─────────────────────────────────────────────────────────────────

  async create(dto: CreateItemDto, userId: string): Promise<ItemDocument> {
    const item = new this.itemModel({ ...dto, createdBy: userId });
    return item.save();
  }

  async findAll(query: {
    search?: string;
    type?: string;
    category?: string;
    isActive?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: ItemDocument[]; total: number; page: number; pages: number }> {
    const filter: Record<string, any> = {};

    if (query.search) {
      filter.$or = [
        { name:        { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
        { sku:         { $regex: query.search, $options: 'i' } },
        { category:    { $regex: query.search, $options: 'i' } },
      ];
    }
    if (query.type)     filter.type     = query.type;
    if (query.category) filter.category = { $regex: query.category, $options: 'i' };
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === 'true';
    }

    const page  = Number(query.page)  || 1;
    const limit = Number(query.limit) || 20;
    const skip  = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.itemModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email')
        .lean(),
      this.itemModel.countDocuments(filter),
    ]);

    return { data, total, page, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<ItemDocument> {
    const item = await this.itemModel
      .findById(id)
      .populate('createdBy',      'name email')
      .populate('usedInInvoices', 'invoiceNumber clientName total status')
      .populate('usedInProposals','subject status total');

    if (!item) throw new NotFoundException(`Item ${id} not found`);
    return item;
  }

  async update(id: string, dto: UpdateItemDto): Promise<ItemDocument> {
    await this.findOne(id); // ensures it exists — throws 404 if not

    const updated = await this.itemModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('createdBy', 'name email');

    // findByIdAndUpdate can theoretically return null if the document was
    // deleted between the findOne check above and this call, so we guard it.
    if (!updated) throw new NotFoundException(`Item ${id} not found`);
    return updated;
  }

  async remove(id: string): Promise<{ message: string }> {
    const item = await this.findOne(id);
    await item.deleteOne();
    return { message: `Item "${item.name}" deleted` };
  }

  // ── Link tracking ─────────────────────────────────────────────────────────

  /** Called by InvoicesService after an invoice is saved */
  async linkToInvoice(itemId: string, invoiceId: string): Promise<void> {
    await this.itemModel.findByIdAndUpdate(itemId, {
      $addToSet: { usedInInvoices: new Types.ObjectId(invoiceId) },
    });
  }

  /** Called by ProposalsService after a proposal is saved */
  async linkToProposal(itemId: string, proposalId: string): Promise<void> {
    await this.itemModel.findByIdAndUpdate(itemId, {
      $addToSet: { usedInProposals: new Types.ObjectId(proposalId) },
    });
  }

  /** Unlink when an invoice / proposal is deleted */
  async unlinkFromInvoice(itemId: string, invoiceId: string): Promise<void> {
    await this.itemModel.findByIdAndUpdate(itemId, {
      $pull: { usedInInvoices: new Types.ObjectId(invoiceId) },
    });
  }

  async unlinkFromProposal(itemId: string, proposalId: string): Promise<void> {
    await this.itemModel.findByIdAndUpdate(itemId, {
      $pull: { usedInProposals: new Types.ObjectId(proposalId) },
    });
  }

  // ── Line-item resolver ────────────────────────────────────────────────────
  /**
   * Given a list of ItemLineDtos (picked from the catalogue),
   * fetch each Item from DB and return fully computed line objects
   * ready to be stored inside an Invoice or Proposal.
   *
   * Callers (InvoicesService / ProposalsService) use this to
   * turn { itemId, quantity, overrides } → { description, unitPrice, tax, discount, amount }
   */
  async resolveLines(lines: ItemLineDto[]): Promise<{
    name: string;
    itemRef:      string;
    description:  string;
    quantity:     number;
    unitPrice:    number;
    taxRate:      number;
    discountRate: number;
    amount:       number;
  }[]> {
    const resolved = await Promise.all(
      lines.map(async (line) => {
        const item = await this.itemModel.findById(line.itemId).lean();
        if (!item) throw new NotFoundException(`Item ${line.itemId} not found`);

        const description  = line.description  ?? item.description ?? item.name;
        const unitPrice    = line.unitPrice     ?? item.unitPrice;
        const taxRate      = line.taxRate       ?? item.taxRate      ?? 0;
        const discountRate = line.discountRate  ?? item.discountRate ?? 0;
        const qty          = line.quantity;

        const base        = qty * unitPrice;
        const discountAmt = base * (discountRate / 100);
        const afterDisc   = base - discountAmt;
        const taxAmt      = afterDisc * (taxRate / 100);
        const amount      = Math.round((afterDisc + taxAmt) * 100) / 100;

        return {
          name:item.name,
          itemRef:     String(item._id),
          description,
          quantity:    qty,
          unitPrice,
          taxRate,
          discountRate,
          amount,
        };
      }),
    );
    return resolved;
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  async stats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byType: Record<string, number>;
    byCategory: { category: string; count: number }[];
    mostUsed: { name: string; invoiceCount: number; proposalCount: number }[];
  }> {
    const [counts, byType, byCategory, mostUsed] = await Promise.all([
      this.itemModel.aggregate([
        {
          $group: {
            _id:      null,
            total:    { $sum: 1 },
            active:   { $sum: { $cond: ['$isActive', 1, 0] } },
            inactive: { $sum: { $cond: ['$isActive', 0, 1] } },
          },
        },
      ]),
      this.itemModel.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      this.itemModel.aggregate([
        { $match: { category: { $ne: null } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { category: '$_id', count: 1, _id: 0 } },
      ]),
      this.itemModel.aggregate([
        {
          $project: {
            name:          1,
            invoiceCount:  { $size: '$usedInInvoices' },
            proposalCount: { $size: '$usedInProposals' },
          },
        },
        {
          $addFields: {
            totalUsage: { $add: ['$invoiceCount', '$proposalCount'] },
          },
        },
        { $sort: { totalUsage: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const c       = counts[0] || { total: 0, active: 0, inactive: 0 };
    const typeMap: Record<string, number> = {};
    byType.forEach((t) => (typeMap[t._id] = t.count));

    return {
      total:      c.total,
      active:     c.active,
      inactive:   c.inactive,
      byType:     typeMap,
      byCategory,
      mostUsed,
    };
  }
}