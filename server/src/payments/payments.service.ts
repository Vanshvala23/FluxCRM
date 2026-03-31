import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment, PaymentDocument } from './schemas/payment.shema';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

// ── Matches your Invoice schema exactly ───────────────────────────────────────
interface InvoiceShape {
  _id: Types.ObjectId;
  invoiceNumber: string;
  clientName: string;       // ✅ not "customer" — your schema uses clientName
  clientEmail?: string;
  clientCompany?: string;
  total: number;
  amountPaid: number;
  amountDue: number;
  currency?: string;
  status: string;
  paymentMethod?: string;
}

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,

    @InjectModel('Invoice')
    private readonly invoiceModel: Model<InvoiceShape & Document>,
  ) {}

  // ─── Auto-generate payment number ────────────────────────────────────────
  private async generatePaymentNumber(): Promise<string> {
    const count = await this.paymentModel.countDocuments();
    return `PAY-${String(count + 1).padStart(6, '0')}`;
  }

  // ─── CREATE ───────────────────────────────────────────────────────────────
  async create(dto: CreatePaymentDto): Promise<PaymentDocument> {
    const invoice = await this.invoiceModel
      .findById(dto.invoice)
      .lean()
      .exec() as InvoiceShape | null;

    if (!invoice) {
      throw new BadRequestException(`Invoice #${dto.invoice} not found`);
    }

    // Guard: don't overpay
    if (dto.amount > invoice.amountDue) {
      throw new BadRequestException(
        `Payment amount (${dto.amount}) exceeds amount due (${invoice.amountDue})`,
      );
    }

    const paymentNumber = await this.generatePaymentNumber();

    // Save payment — use clientName from invoice schema
    const payment = new this.paymentModel({
      paymentNumber,
      invoice:       new Types.ObjectId(dto.invoice),
      invoiceNumber: invoice.invoiceNumber,
      customerName:  invoice.clientName,      // ✅ clientName → customerName (display)
      customerEmail: invoice.clientEmail ?? '',
      company:       invoice.clientCompany ?? '',
      amount:        dto.amount,
      paymentMode:   dto.paymentMode,
      transactionId: dto.transactionId ?? '',
      paymentDate:   dto.paymentDate,
      note:          dto.note ?? '',
      currency:      dto.currency ?? invoice.currency ?? 'USD',
    });

    const saved = await payment.save();

    // ── Update invoice amountPaid + amountDue + status ────────────────────
    const newAmountPaid = invoice.amountPaid + dto.amount;
    const newAmountDue  = Math.max(0, invoice.total - newAmountPaid);
    const newStatus     = newAmountDue === 0 ? 'paid' : invoice.status;

    await this.invoiceModel.findByIdAndUpdate(dto.invoice, {
      amountPaid: newAmountPaid,
      amountDue:  newAmountDue,
      status:     newStatus,
    });

    return saved;
  }

  // ─── READ ALL (search + pagination) ──────────────────────────────────────
  async findAll(query: { search?: string; page?: number; limit?: number }) {
    const { search = '', page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (search) {
      filter.$or = [
        { paymentNumber: { $regex: search, $options: 'i' } },
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { customerName:  { $regex: search, $options: 'i' } },
        { transactionId: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.paymentModel
        .find(filter)
        .populate('invoice', 'invoiceNumber total amountPaid amountDue status clientName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.paymentModel.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── READ ONE ─────────────────────────────────────────────────────────────
  async findOne(id: string): Promise<PaymentDocument> {
    const payment = await this.paymentModel
      .findById(id)
      .populate('invoice', 'invoiceNumber total amountPaid amountDue status clientName clientEmail')
      .exec();

    if (!payment) throw new NotFoundException(`Payment #${id} not found`);
    return payment;
  }

  // ─── GET ALL PAYMENTS FOR AN INVOICE ─────────────────────────────────────
  async findByInvoice(invoiceId: string): Promise<PaymentDocument[]> {
    return this.paymentModel
      .find({ invoice: new Types.ObjectId(invoiceId) })
      .sort({ paymentDate: -1 })
      .exec();
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────
  async update(id: string, dto: UpdatePaymentDto): Promise<PaymentDocument> {
    const updated = await this.paymentModel
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .exec();

    if (!updated) throw new NotFoundException(`Payment #${id} not found`);
    return updated;
  }

  // ─── DELETE ───────────────────────────────────────────────────────────────
  async remove(id: string): Promise<{ message: string }> {
    const payment = await this.paymentModel.findById(id).lean().exec();
    if (!payment) throw new NotFoundException(`Payment #${id} not found`);

    // ── Reverse the amountPaid on invoice ────────────────────────────────
    const invoice = await this.invoiceModel
      .findById(payment.invoice)
      .lean()
      .exec() as InvoiceShape | null;

    if (invoice) {
      const newAmountPaid = Math.max(0, invoice.amountPaid - payment.amount);
      const newAmountDue  = Math.max(0, invoice.total - newAmountPaid);
      const newStatus     = newAmountDue > 0 && invoice.status === 'paid'
        ? 'sent'
        : invoice.status;

      await this.invoiceModel.findByIdAndUpdate(payment.invoice, {
        amountPaid: newAmountPaid,
        amountDue:  newAmountDue,
        status:     newStatus,
      });
    }

    await this.paymentModel.findByIdAndDelete(id);
    return { message: `Payment #${id} deleted successfully` };
  }
}