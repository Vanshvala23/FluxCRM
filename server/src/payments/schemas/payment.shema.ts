import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentDocument = Payment & Document;

export type PaymentMode =
  | 'bank' | 'cash' | 'cheque'
  | 'credit_card' | 'upi' | 'other';

@Schema({ timestamps: true })
export class Payment {
  @Prop({ required: true })
  paymentNumber!: string;                    // e.g. PAY-000001

  @Prop({ type: Types.ObjectId, ref: 'Invoice', required: true })
  invoice!: Types.ObjectId;                 // ref to Invoice

  @Prop({ required: true })
  invoiceNumber!: string;                   // denorm from invoice.invoiceNumber

  // ── Denormalized from invoice.clientName / clientEmail / clientCompany ──
  @Prop({ type: String, default: '' })
  customerName!: string;                    // from invoice.clientName

  @Prop({ type: String, default: '' })
  customerEmail!: string;                   // from invoice.clientEmail

  @Prop({ type: String, default: '' })
  company!: string;                         // from invoice.clientCompany

  @Prop({ required: true, min: 0 })
  amount!: number;

  @Prop({
    type: String,
    enum: ['bank', 'cash', 'cheque', 'credit_card', 'upi', 'other'],
    default: 'bank',
  })
  paymentMode!: PaymentMode;

  @Prop({ type: String, default: '' })
  transactionId!: string;

  @Prop({ required: true })
  paymentDate!: string;                     // ISO date e.g. "2026-04-08"

  @Prop({ type: String, default: '' })
  note!: string;

  @Prop({ type: String, default: 'USD' })
  currency!: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);