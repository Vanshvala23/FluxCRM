import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InvoiceDocument = Invoice & Document;

export class InvoiceItem {
  @Prop({ required: true }) description!: string;
  @Prop({ required: true, default: 1 }) quantity!: number;
  @Prop({ required: true, default: 0 }) unitPrice!: number;
  @Prop({ default: 0 }) tax!: number;       // % e.g. 18 for 18%
  @Prop({ default: 0 }) discount!: number;  // % e.g. 10 for 10%
  @Prop({ default: 0 }) amount!: number;    // computed: qty * unitPrice * (1-disc%) * (1+tax%)
}

@Schema({ timestamps: true })
export class Invoice {
  /* ── Identification ─────────────────────────────── */
  @Prop({ required: true, unique: true })
  invoiceNumber!: string;          // e.g. INV-2026-0001

  @Prop({
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft',
  })
  status!: string;

  /* ── Client info ────────────────────────────────── */
  @Prop({ required: true }) clientName!: string;
  @Prop() clientEmail!: string;
  @Prop() clientPhone!: string;
  @Prop() clientAddress!: string;
  @Prop() clientCompany!: string;

  /* ── Optional CRM links ─────────────────────────── */
  @Prop({ type: Types.ObjectId, ref: 'Contact' }) contact!: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Lead' })    lead!: Types.ObjectId;

  /* ── Dates ──────────────────────────────────────── */
  @Prop({ required: true }) issueDate!: string;   // ISO date string
  @Prop({ required: true }) dueDate!: string;

  /* ── Line items & totals ────────────────────────── */
  @Prop({ type: [Object], default: [] }) items!: InvoiceItem[];

  @Prop({ default: 0 }) subtotal!: number;
  @Prop({ default: 0 }) totalTax!: number;
  @Prop({ default: 0 }) totalDiscount!: number;
  @Prop({ default: 0 }) total!: number;

  /* ── Payment ────────────────────────────────────── */
  @Prop({ default: 0 }) amountPaid!: number;
  @Prop({ default: 0 }) amountDue!: number;

  @Prop({
    type: String,
    enum: ['cash', 'bank_transfer', 'credit_card', 'cheque', 'other'],
    default: 'bank_transfer',
  })
  paymentMethod!: string;

  /* ── Misc ───────────────────────────────────────── */
  @Prop() currency!: string;        // default 'USD'
  @Prop() notes!: string;
  @Prop() terms!: string;
  @Prop() signature!: string;       // base64 or URL

  @Prop({ type: Types.ObjectId, ref: 'User' }) createdBy!: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User' }) assignedTo!: Types.ObjectId;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);