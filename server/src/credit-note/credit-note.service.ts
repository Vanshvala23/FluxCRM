import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreditNote, CreditNoteDocument } from './schemas/credit-note-schema';
import { CreateCreditNoteDto, LineItemDto } from './dto/create-credit-note.dto';
import { UpdateCreditNoteDto } from './dto/update-credit-note.dto';

@Injectable()
export class CreditNoteService {
  constructor(
    @InjectModel(CreditNote.name)
    private readonly creditNoteModel: Model<CreditNoteDocument>,
  ) {}

  // ─── Auto-calculate totals ────────────────────────────────────────────────
  private calculateTotals(
    items: LineItemDto[],
    discountPercent = 0,
    adjustment = 0,
    discountType = 'no_discount',
  ) {
    const subTotal = items.reduce((sum, it) => sum + it.qty * it.rate, 0);

    const taxTotal = items.reduce((sum, it) => {
      if (!it.tax) return sum;
      return sum + it.qty * it.rate * (it.tax / 100);
    }, 0);

    const discountBase =
      discountType === 'before_tax' ? subTotal : subTotal + taxTotal;
    const discountAmount = (discountBase * discountPercent) / 100;

    const total =
      subTotal +
      (discountType !== 'no_discount' ? taxTotal : 0) -
      discountAmount +
      adjustment;

    return {
      subTotal: parseFloat(subTotal.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
    };
  }

  private buildItems(items: LineItemDto[]) {
    return items.map(it => ({
      ...it,
      amount: parseFloat((it.qty * it.rate).toFixed(2)),
      tax: it.tax ?? null,
      description: it.description ?? '',
    }));
  }

  // ─── CREATE ───────────────────────────────────────────────────────────────
  async create(dto: CreateCreditNoteDto): Promise<CreditNoteDocument> {
    const items = this.buildItems(dto.items);
    const totals = this.calculateTotals(
      dto.items,
      dto.discountPercent ?? 0,
      dto.adjustment ?? 0,
      dto.discountType,
    );

    const created = new this.creditNoteModel({
      ...dto,
      items,
      ...totals,
    });

    return created.save();
  }

  // ─── READ ALL ─────────────────────────────────────────────────────────────
  async findAll(): Promise<CreditNoteDocument[]> {
    return this.creditNoteModel.find().sort({ createdAt: -1 }).exec();
  }

  // ─── READ ONE ─────────────────────────────────────────────────────────────
  async findOne(id: string): Promise<CreditNoteDocument> {
    const note = await this.creditNoteModel.findById(id).exec();
    if (!note) throw new NotFoundException(`Credit note #${id} not found`);
    return note;
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────
  async update(id: string, dto: UpdateCreditNoteDto): Promise<CreditNoteDocument> {
    const existing = await this.findOne(id);

    const items = dto.items ? this.buildItems(dto.items) : existing.items;
    const totals = this.calculateTotals(
      dto.items ?? existing.items,
      dto.discountPercent ?? existing.discountPercent,
      dto.adjustment ?? existing.adjustment,
      dto.discountType ?? existing.discountType,
    );

    const updated = await this.creditNoteModel
      .findByIdAndUpdate(
        id,
        { ...dto, items, ...totals },
        { new: true, runValidators: true },
      )
      .exec();

    if (!updated) throw new NotFoundException(`Credit note #${id} not found`);
    return updated;
  }

  // ─── DELETE ───────────────────────────────────────────────────────────────
  async remove(id: string): Promise<{ message: string }> {
    const result = await this.creditNoteModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException(`Credit note #${id} not found`);
    return { message: `Credit note #${id} deleted successfully` };
  }
}