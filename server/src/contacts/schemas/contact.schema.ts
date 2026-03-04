import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ContactDocument = Contact & Document;

@Schema({ timestamps: true })
export class Contact {
  @Prop({ required: true }) firstName: string;
  @Prop({ required: true }) lastName: string;
  @Prop({ required: true, unique: true, lowercase: true }) email: string;
  @Prop() phone: string;
  @Prop() company: string;
  @Prop() jobTitle: string;
  @Prop({ default: 'active', enum: ['active', 'inactive'] }) status: string;
  @Prop({ type: Types.ObjectId, ref: 'User' }) assignedTo: Types.ObjectId;
  @Prop() notes: string;
}

export const ContactSchema = SchemaFactory.createForClass(Contact);