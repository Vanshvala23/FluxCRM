import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProjectDocument = Project & Document;

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'urgent';

@Schema({ timestamps: true })
export class Project {
  // ── Core ────────────────────────────────────────────────────────────────────
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description: string;

  @Prop({
    type: String,
    enum: ['planning', 'active', 'on_hold', 'completed', 'cancelled'],
    default: 'planning',
  })
  status: ProjectStatus;

  @Prop({
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  })
  priority: ProjectPriority;

  // ── Relations ────────────────────────────────────────────────────────────────
  @Prop({ type: Types.ObjectId, ref: 'Contact' })
  client: Types.ObjectId;          // the client/contact this project is for

  @Prop({ type: Types.ObjectId, ref: 'User' })
  manager: Types.ObjectId;         // project manager (a CRM user)

  @Prop([{ type: Types.ObjectId, ref: 'User' }])
  members: Types.ObjectId[];       // team members

  // ── Timeline ─────────────────────────────────────────────────────────────────
  @Prop()
  startDate: Date;

  @Prop()
  dueDate: Date;

  @Prop()
  completedAt: Date;

  // ── Financials ───────────────────────────────────────────────────────────────
  @Prop({ default: 0 })
  budget: number;

  @Prop({ default: 0 })
  spent: number;

  @Prop({ type: String, default: 'INR' })
  currency: string;

  // ── Progress ─────────────────────────────────────────────────────────────────
  @Prop({ min: 0, max: 100, default: 0 })
  progress: number;               // 0–100 percent

  // ── Tags ─────────────────────────────────────────────────────────────────────
  @Prop([String])
  tags: string[];

  // ── Notes ────────────────────────────────────────────────────────────────────
  @Prop()
  notes: string;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);