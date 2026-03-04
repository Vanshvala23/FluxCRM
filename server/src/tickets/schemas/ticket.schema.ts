import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TicketDocument = Ticket & Document;

@Schema({ timestamps: true })
export class Ticket {
  @Prop({ required: true }) title: string;
  @Prop({ required: true }) description: string;
  @Prop({ default: 'open', enum: ['open', 'in-progress', 'resolved', 'closed'] }) status: string;
  @Prop({ default: 'medium', enum: ['low', 'medium', 'high', 'critical'] }) priority: string;
  @Prop({ type: Types.ObjectId, ref: 'Contact' }) contact: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User' }) assignedTo: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User' }) createdBy: Types.ObjectId;
  @Prop([{ author: String, text: String, createdAt: Date }]) comments: any[];
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);