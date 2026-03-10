import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Invoice, InvoiceDocument, InvoiceItem } from './schemas/invoice-schema';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/create-invoice.dto';
import { ItemsService } from '../items/items.service';
import { ItemLineDto } from '../items/dto/create-item.dto';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectModel(Invoice.name)
    private readonly invoiceModel: Model<InvoiceDocument>,
    private readonly itemsService: ItemsService,
  ) {}

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Auto-generate next invoice number: INV-YYYY-NNNN */
  private async generateInvoiceNumber(): Promise<string> {
    const year   = new Date().getFullYear();
    const prefix = `INV-${year}-`;
    const last   = await this.invoiceModel
      .findOne({ invoiceNumber: { $regex: `^${prefix}` } })
      .sort({ invoiceNumber: -1 })
      .select('invoiceNumber')
      .lean();

    let next = 1;
    if (last) {
      const parts = last.invoiceNumber.split('-');
      next = parseInt(parts[parts.length - 1], 10) + 1;
    }
    return `${prefix}${String(next).padStart(4, '0')}`;
  }

  /** Compute per-item amounts and invoice totals */
  private computeTotals(items: InvoiceItem[]): {
    items: InvoiceItem[];
    subtotal: number;
    totalTax: number;
    totalDiscount: number;
    total: number;
  } {
    let subtotal      = 0;
    let totalTax      = 0;
    let totalDiscount = 0;

    const computed = items.map((item) => {
      const base        = item.quantity * item.unitPrice;
      const discountAmt = base * ((item.discount || 0) / 100);
      const afterDisc   = base - discountAmt;
      const taxAmt      = afterDisc * ((item.tax || 0) / 100);
      const amount      = afterDisc + taxAmt;

      subtotal      += base;
      totalDiscount += discountAmt;
      totalTax      += taxAmt;

      return { ...item, amount: Math.round(amount * 100) / 100 };
    });

    const total = subtotal - totalDiscount + totalTax;

    return {
      items:         computed,
      subtotal:      Math.round(subtotal      * 100) / 100,
      totalTax:      Math.round(totalTax      * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      total:         Math.round(total         * 100) / 100,
    };
  }

  /**
   * Resolve line items from either source:
   *  - dto.itemLines  → catalogue references  → resolved via ItemsService
   *  - dto.items      → raw embedded objects  → used as-is
   * itemLines takes priority when both are present.
   */
  private async resolveRawLines(
    dto: CreateInvoiceDto | UpdateInvoiceDto,
  ): Promise<InvoiceItem[]> {
    if ((dto as CreateInvoiceDto).itemLines?.length) {
      const resolved = await this.itemsService.resolveLines(
        (dto as CreateInvoiceDto).itemLines as ItemLineDto[],
      );
      // Map ItemsService shape → InvoiceItem shape
      return resolved.map((r) => ({
        description: r.description,
        quantity:    r.quantity,
        unitPrice:   r.unitPrice,
        tax:         r.taxRate,
        discount:    r.discountRate,
        amount:      r.amount,
      })) as InvoiceItem[];
    }
    return ((dto as any).items as InvoiceItem[]) || [];
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async create(dto: CreateInvoiceDto, userId: string): Promise<InvoiceDocument> {
    const invoiceNumber = await this.generateInvoiceNumber();

    // Resolve lines from catalogue or raw items
    const rawLines = await this.resolveRawLines(dto);
    const { items, subtotal, totalTax, totalDiscount, total } =
      this.computeTotals(rawLines);

    const amountPaid = dto.amountPaid || 0;
    const amountDue  = Math.max(0, total - amountPaid);

    const invoice = await new this.invoiceModel({
      ...dto,
      invoiceNumber,
      items,
      subtotal,
      totalTax,
      totalDiscount,
      total,
      amountPaid,
      amountDue,
      currency:  dto.currency || 'USD',
      createdBy: userId,
    }).save();

    // Track usage — link each catalogue item back to this invoice
    if (dto.itemLines?.length) {
      await Promise.all(
        dto.itemLines.map((line) =>
          this.itemsService.linkToInvoice(line.itemId, String(invoice._id)),
        ),
      );
    }

    return invoice;
  }

  async findAll(query: {
    status?: string;
    clientName?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: InvoiceDocument[]; total: number; page: number; pages: number }> {
    const filter: Record<string, any> = {};
    if (query.status)     filter.status     = query.status;
    if (query.clientName) filter.clientName = { $regex: query.clientName, $options: 'i' };

    const page  = Number(query.page)  || 1;
    const limit = Number(query.limit) || 20;
    const skip  = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.invoiceModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('contact',   'firstName lastName email')
        .populate('lead',      'title contactName')
        .populate('createdBy', 'name email')
        .populate('assignedTo','name email')
        .lean(),
      this.invoiceModel.countDocuments(filter),
    ]);

    return { data, total, page, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<InvoiceDocument> {
    const invoice = await this.invoiceModel
      .findById(id)
      .populate('contact',   'firstName lastName email phone')
      .populate('lead',      'title contactName value status')
      .populate('createdBy', 'name email')
      .populate('assignedTo','name email');

    if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);
    return invoice;
  }

  async findByNumber(invoiceNumber: string): Promise<InvoiceDocument> {
    const invoice = await this.invoiceModel
      .findOne({ invoiceNumber })
      .populate('contact',   'firstName lastName email phone')
      .populate('lead',      'title contactName value status')
      .populate('createdBy', 'name email')
      .populate('assignedTo','name email');

    if (!invoice) throw new NotFoundException(`Invoice ${invoiceNumber} not found`);
    return invoice;
  }

  async update(id: string, dto: UpdateInvoiceDto): Promise<InvoiceDocument> {
    const existing = await this.findOne(id);

    // Resolve lines — prefer incoming itemLines/items, fall back to stored items
    let rawLines: InvoiceItem[];
    if ((dto as any).itemLines?.length || (dto as any).items?.length) {
      rawLines = await this.resolveRawLines(dto);
    } else {
      rawLines = existing.items;
    }

    const { items: computedItems, subtotal, totalTax, totalDiscount, total } =
      this.computeTotals(rawLines);

    const amountPaid = dto.amountPaid ?? existing.amountPaid;
    const amountDue  = Math.max(0, total - amountPaid);

    const updated = await this.invoiceModel
      .findByIdAndUpdate(
        id,
        {
          ...dto,
          items: computedItems,
          subtotal,
          totalTax,
          totalDiscount,
          total,
          amountPaid,
          amountDue,
        },
        { new: true },
      )
      .populate('contact',   'firstName lastName email')
      .populate('lead',      'title contactName')
      .populate('createdBy', 'name email')
      .populate('assignedTo','name email');

    if (!updated) throw new NotFoundException(`Invoice ${id} not found`);

    // Re-link catalogue items if itemLines were provided in the update
    if ((dto as any).itemLines?.length) {
      await Promise.all(
        (dto as any).itemLines.map((line: ItemLineDto) =>
          this.itemsService.linkToInvoice(line.itemId, id),
        ),
      );
    }

    return updated;
  }

  async remove(id: string): Promise<{ message: string }> {
    const invoice = await this.findOne(id);
    await invoice.deleteOne();
    return { message: `Invoice ${invoice.invoiceNumber} deleted` };
  }

  // ── Payment shortcut ──────────────────────────────────────────────────────

  async markPaid(id: string, amountPaid?: number): Promise<InvoiceDocument> {
    const invoice   = await this.findOne(id);
    const paid      = amountPaid ?? invoice.total;
    const amountDue = Math.max(0, invoice.total - paid);
    const status    = amountDue === 0 ? 'paid' : invoice.status;

    const updated = await this.invoiceModel
      .findByIdAndUpdate(id, { amountPaid: paid, amountDue, status }, { new: true })
      .populate('contact createdBy assignedTo');

    if (!updated) throw new NotFoundException(`Invoice ${id} not found`);
    return updated;
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  async stats(): Promise<{
    total: number;
    totalRevenue: number;
    totalOutstanding: number;
    byStatus: Record<string, number>;
    recentInvoices: InvoiceDocument[];
  }> {
    const [byStatus, totals, recentInvoices] = await Promise.all([
      this.invoiceModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.invoiceModel.aggregate([
        {
          $group: {
            _id:              null,
            totalRevenue:     { $sum: '$total' },
            totalOutstanding: { $sum: '$amountDue' },
            totalInvoices:    { $sum: 1 },
          },
        },
      ]),
      this.invoiceModel
        .find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('contact', 'firstName lastName')
        .lean(),
    ]);

    const statusMap: Record<string, number> = {};
    byStatus.forEach((s) => (statusMap[s._id] = s.count));

    const t = totals[0] || { totalRevenue: 0, totalOutstanding: 0, totalInvoices: 0 };

    return {
      total:            t.totalInvoices,
      totalRevenue:     t.totalRevenue,
      totalOutstanding: t.totalOutstanding,
      byStatus:         statusMap,
      recentInvoices,
    };
  }
}