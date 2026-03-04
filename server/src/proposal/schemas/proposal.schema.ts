import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProposalDocument = Proposal & Document;

export type ProposalStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'rejected'
  | 'expired';

@Schema({ timestamps: true })
export class Proposal {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'Contact', required: true })
  contact: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Lead' })
  lead: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'],
    default: 'draft',
  })
  status: ProposalStatus;

  @Prop({ type: Number, default: 0 })
  amount: number;

  @Prop({ type: String, default: 'INR' })
  currency: string;

  @Prop({ type: Date })
  validUntil: Date;

  @Prop({ type: Date })
  sentAt: Date;

  @Prop({ type: Date })
  viewedAt: Date;

  @Prop({ type: Date })
  respondedAt: Date;

  // Line items
  @Prop({
    type: [
      {
        name: { type: String, required: true },
        description: { type: String },
        quantity: { type: Number, default: 1 },
        unitPrice: { type: Number, required: true },
        total: { type: Number },
      },
    ],
    default: [],
  })
  items: {
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];

  @Prop({ type: Number, default: 0 })
  taxPercent: number;

  @Prop({ type: Number, default: 0 })
  discountPercent: number;

  @Prop({ trim: true })
  notes: string;

  @Prop({ trim: true })
  terms: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;
}

export const ProposalSchema = SchemaFactory.createForClass(Proposal);

// Auto-compute item totals and proposal amount before save
ProposalSchema.pre('save', function () {
  if (this.items && this.items.length > 0) {
    let subtotal = 0;
    this.items = this.items.map((item) => {
      const total = item.quantity * item.unitPrice;
      subtotal += total;
      return { ...item, total };
    });

    const afterDiscount = subtotal * (1 - (this.discountPercent || 0) / 100);
    this.amount = afterDiscount * (1 + (this.taxPercent || 0) / 100);
  }
});