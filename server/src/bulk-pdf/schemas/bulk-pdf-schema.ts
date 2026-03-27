import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BulkPdfDocument = BulkPdf & Document;

@Schema({ timestamps: true })
export class BulkPdf {
  @Prop({ required: true })
  originalName!: string; // e.g. "invoices-2024-01-01-to-2024-12-31.pdf"

  @Prop({ required: true })
  mimeType!: string; // always "application/pdf"

  @Prop({ required: true })
  size!: number; // file size in bytes

  @Prop({ required: true, type: Buffer })
  data!: Buffer; // merged PDF binary stored in MongoDB

  @Prop({ default: '' })
  description!: string;

  @Prop({ default: '' })
  uploadedBy!: string;

  // ─── Export metadata ──────────────────────────────────────────────────────
  @Prop({ type: String, enum: ['invoices', 'proposals'], default: null })
  type!: string | null;

  @Prop({ type: Date, default: null })
  fromDate!: Date | null;

  @Prop({ type: Date, default: null })
  toDate!: Date | null;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ default: 0 })
  recordCount!: number; // how many records were merged
}

export const BulkPdfSchema = SchemaFactory.createForClass(BulkPdf);