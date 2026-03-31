import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TicketDocument = Ticket & Document;

@Schema({ timestamps: true })
export class Ticket {
  @Prop({ required: true }) title: string;
  @Prop({ required: true }) description: string;

  @Prop({
    default: 'open',
    enum: ['open', 'in-progress', 'resolved', 'closed'],
  })
  status: string;

  @Prop({
    default: 'medium',
    enum: ['low', 'medium', 'high', 'critical'],
  })
  priority: string;

  @Prop({ type: Types.ObjectId, ref: 'Contact' })
  contact: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignedTo: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  // 🌍 Public visibility
  @Prop({ default: false })
  isPublic: boolean;

  // 💬 Replies (replaces comments)
  @Prop({
    type: [
      {
        message: { type: String, required: true },
        sender: {
          type: String,
          enum: ['user', 'admin'],
          required: true,
        },
        user: { type: Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  replies: {
    message: string;
    sender: 'user' | 'admin';
    user?: Types.ObjectId;
    createdAt: Date;
  }[];
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);