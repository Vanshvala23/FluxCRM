import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CreditNoteDocument = CreditNote & Document;

export type DiscountType = 'no_discount' | 'before_tax' | 'after_tax';
export type QuantityType = 'qty' | 'hours' | 'qty_hours';
export type CurrencyType = 'USD' | 'EUR';
export type TaxRate = 5 | 10 | 18;

@Schema({ _id: false })
export class Address {
  @Prop({ default: '' })
    line1!: string;
  @Prop({ default: '' })
    line2!: string;
  @Prop({ default: '' })
    city!: string;
  @Prop({ default: '' })
    state!: string;
  @Prop({ default: '' })
    zip!: string;
  @Prop({ default: '' })
    country!: string;
}

@Schema({ _id: false })
export class LineItem {
  @Prop({ required: true })
    item!: string;
  @Prop({ default: '' })
    description!: string;
  @Prop({ required: true, min: 0 })
    qty!: number;
  @Prop({ required: true, min: 0 })
    rate!: number;
  @Prop({ type: Number, enum: [5, 10, 18], default: null })
    tax!: TaxRate | null;
  @Prop({ required: true, min: 0 })
    amount!: number;
}

@Schema({ timestamps: true })
export class CreditNote {
  @Prop({ required: true })
    customer!: string;
  @Prop({ type: Address, default: () => ({}) })
    billTo!: Address;
  @Prop({ type: Address, default: () => ({}) })
    shipTo!: Address;

  @Prop({ required: true })
    creditNoteDate!: string;
  @Prop({ required: true })
    creditNoteNumber!: string;

  @Prop({ type: String, enum: ['USD', 'EUR'], default: 'USD' })
    currency!: CurrencyType;

  @Prop({ type: String, enum: ['no_discount', 'before_tax', 'after_tax'], default: 'no_discount' })
    discountType!: DiscountType;

  @Prop({ default: '' })
    referenceNumber!: string;
  @Prop({ default: '' })
    adminNote!: string;

  @Prop({ type: [LineItem], default: [] })
    items!: LineItem[];

  @Prop({ type: String, enum: ['qty', 'hours', 'qty_hours'], default: 'qty' })
    showQuantityAs!: QuantityType;

  @Prop({ default: 0, min: 0, max: 100 })
    discountPercent!: number;
  @Prop({ default: 0 })
    adjustment!: number;

  @Prop({ default: 0 })
    subTotal!: number;
  @Prop({ default: 0 })
    discountAmount!: number;
  @Prop({ default: 0 })
    total!: number;

  @Prop({ default: '' })
    clientNote!: string;
  @Prop({ default: '' })
    termsAndConditions!: string;
}

export const CreditNoteSchema = SchemaFactory.createForClass(CreditNote);