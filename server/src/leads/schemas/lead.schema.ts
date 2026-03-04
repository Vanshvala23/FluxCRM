import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LeadDocument = Lead & Document;

@Schema({ timestamps: true })
export class Lead {
  @Prop({ required: true }) title: string;
  @Prop({ required: true }) contactName: string;
  @Prop() contactEmail: string;
  @Prop() company: string;
  @Prop() source: string; // e.g. website, referral, cold-call
  @Prop({ default: 'new', enum: ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'] }) status: string;
  @Prop({ default: 0 }) value: number; // deal value
  @Prop() notes: string;
  @Prop({ type: Types.ObjectId, ref: 'User' }) assignedTo: Types.ObjectId;
}

export const LeadSchema = SchemaFactory.createForClass(Lead);