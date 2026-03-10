import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TaskDocument = Task & Document;

@Schema({ timestamps: true })
export class Task {
  @Prop({ required: true, index: true })
  subject: string;

  @Prop({ type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' })
  priority: string;

  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Date })
  dueDate: Date;

  @Prop({ type: String, enum: ['pending', 'in_progress', 'completed', 'cancelled'], default: 'pending' })
  status: string;

  @Prop({ type: String, default: 'private' })
  visibility: string; // 'public' | 'private'

  @Prop({ type: Boolean, default: false })
  billable: boolean;

  @Prop({ type: Number })
  hourlyRate: number; // Billing rate if billable

  @Prop({ type: String })
  description: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  assignees: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  followers: Types.ObjectId[];

  @Prop({ 
    type: String, 
    enum: ['none', 'weekly', 'biweekly', 'monthly', 'bimonthly', 'quarterly', 'yearly', 'custom'],
    default: 'none'
  })
  recurrencePattern: string;

  @Prop({ type: String })
  customRecurrence: string; // For custom recurrence patterns (e.g., cron expression)

  @Prop({ type: String, enum: ['project', 'invoice', 'customer', 'estimate', 'contract', 'ticket', 'expense', 'lead', 'proposal'] })
  relatedType: string; // Type of related entity

  @Prop({ type: Types.ObjectId, refPath: 'relatedType' })
  relatedId: Types.ObjectId; // ID of related entity

  @Prop({ type: [{ text: String, completed: Boolean, _id: Types.ObjectId }], default: [] })
  checklist: Array<{ text: string; completed: boolean; _id: Types.ObjectId }>;

  @Prop({ type: [String], default: [] })
  attachments: string[]; // Array of file URLs

  @Prop({ type: Number, default: 0 })
  estimatedHours: number; // Estimated hours for task completion

  @Prop({ type: Number, default: 0 })
  actualHours: number; // Actual hours spent

  @Prop({ type: Date })
  completedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  completedBy: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  progress: number; // 0-100

  @Prop({ type: Types.ObjectId, ref: 'Team' })
  teamId: Types.ObjectId; // For team tasks
}

export const TaskSchema = SchemaFactory.createForClass(Task);
TaskSchema.index({ createdBy: 1, createdAt: -1 });
TaskSchema.index({ assignees: 1, status: 1 });
TaskSchema.index({ relatedType: 1, relatedId: 1 });