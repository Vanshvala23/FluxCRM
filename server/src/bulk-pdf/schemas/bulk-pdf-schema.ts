import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BulkPdfDocument = BulkPdf & Document;

@Schema({ timestamps: true })
export class BulkPdf {
  @Prop({ required: true })
  originalName!: string;

  @Prop({ required: true })
  mimeType!: string;

  @Prop({ required: true })
  size!: number;

  // ✅ Explicit Buffer type — avoids BSON Binary wrapping issues on retrieval
  @Prop({ type: Buffer, required: true })
  data!: Buffer;

  @Prop({ default: '' })
  description!: string;

  @Prop({ default: '' })
  uploadedBy!: string;

  @Prop({ type: String, enum: ['invoices', 'proposals'], default: null })
  type!: string | null;

  @Prop({ type: Date, default: null })
  fromDate!: Date | null;

  @Prop({ type: Date, default: null })
  toDate!: Date | null;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ default: 0 })
  recordCount!: number;
}

export const BulkPdfSchema = SchemaFactory.createForClass(BulkPdf);