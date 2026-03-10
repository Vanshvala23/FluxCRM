import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ItemDocument = Item & Document;

@Schema({ timestamps: true })
export class Item {
  /* ── Identity ───────────────────────────────────── */
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop()
  sku: string;                    // optional stock-keeping unit / item code

  @Prop({
    type: String,
    enum: ['product', 'service'],
    default: 'service',
  })
  type: string;

  /* ── Pricing ────────────────────────────────────── */
  @Prop({ required: true, default: 0 })
  unitPrice: number;

  @Prop({ default: 'USD' })
  currency: string;

  @Prop({ default: 0 })
  taxRate: number;                // default tax % applied when item is added to invoice/proposal

  @Prop({ default: 0 })
  discountRate: number;           // default discount %

  /* ── Categorisation ─────────────────────────────── */
  @Prop()
  category: string;               // e.g. "Software", "Consulting", "Hardware"

  @Prop()
  unit: string;                   // e.g. "hour", "piece", "month", "license"

  @Prop({ default: true })
  isActive: boolean;

  /* ── Usage tracking ─────────────────────────────── */
  @Prop({ type: [Types.ObjectId], ref: 'Invoice',  default: [] })
  usedInInvoices: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'Proposal', default: [] })
  usedInProposals: Types.ObjectId[];

  /* ── Audit ──────────────────────────────────────── */
  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;
}

export const ItemSchema = SchemaFactory.createForClass(Item);

// text index for search
ItemSchema.index({ name: 'text', description: 'text', sku: 'text' });