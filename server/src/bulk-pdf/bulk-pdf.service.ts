import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

import { BulkPdf, BulkPdfDocument } from './schemas/bulk-pdf-schema';
import { CreateBulkPdfDto } from './dto/create-bulk-pdf.dto';

const INVOICE_MODEL = 'Invoice';
const PROPOSAL_MODEL = 'Proposal';

interface RecordShape {
  _id: string;
  invoiceNumber?: string;
  proposalNumber?: string;

  issueDate?: any;
  invoiceDate?: any;
  proposalDate?: any;

  clientName?: string;
  customer?: string | { name?: string };

  total?: number;
  currency?: string;

  items?: any[];
  tags?: string[];
}

@Injectable()
export class BulkPdfService {
  constructor(
    @InjectModel(BulkPdf.name)
    private readonly bulkPdfModel: Model<BulkPdfDocument>,

    @InjectModel(INVOICE_MODEL)
    private readonly invoiceModel: Model<any>,

    @InjectModel(PROPOSAL_MODEL)
    private readonly proposalModel: Model<any>,
  ) {}

  private getModel(type: string): Model<any> {
    if (type === 'invoices') return this.invoiceModel;
    if (type === 'proposals') return this.proposalModel;
    throw new BadRequestException(`Unsupported type: ${type}`);
  }

  private getDate(record: RecordShape, field: string) {
    return (
      record[field] ||
      record.issueDate ||
      record.invoiceDate ||
      record.proposalDate
    );
  }

  private getCustomer(record: RecordShape) {
    if (record.clientName) return record.clientName;

    if (typeof record.customer === 'object') {
      return record.customer?.name ?? 'N/A';
    }

    return record.customer ?? 'N/A';
  }

  // ✅ PURE PDF-LIB (NO CHROME 🚀)
  private async generatePdf(records: RecordShape[], type: string): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    for (const record of records) {
      const page = pdfDoc.addPage([595, 842]);
      let y = 800;

      const draw = (text: string, size = 12) => {
        page.drawText(text, { x: 50, y, size, font, color: rgb(0, 0, 0) });
        y -= size + 8;
      };

      const number =
        record.invoiceNumber ?? record.proposalNumber ?? record._id;

      const rawDate = this.getDate(record, 'issueDate');
      const date = rawDate
        ? new Date(rawDate).toISOString().split('T')[0]
        : 'N/A';

      const customer = this.getCustomer(record);

      draw(`${type.toUpperCase()} #${number}`, 18);
      draw('');
      draw(`Customer: ${customer}`);
      draw(`Date: ${date}`);
      draw('');

      if (record.items?.length) {
        draw('Items:', 14);

        record.items.forEach((item: any, i: number) => {
          draw(
            `${i + 1}. ${item.description || item.item} | Qty: ${
              item.quantity || item.qty
            } | ₹${item.amount || 0}`,
          );
        });
      } else {
        draw('No items');
      }

      draw('');
      draw(`Total: ₹${record.total ?? 0}`, 14);
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  async exportAndStore(dto: CreateBulkPdfDto): Promise<BulkPdfDocument> {
    if (!dto.type) throw new BadRequestException('type is required');

    const model = this.getModel(dto.type);
    const dateField = dto.type === 'invoices' ? 'issueDate' : 'proposalDate';

    let from: Date | null = null;
    let to: Date | null = null;

    if (dto.fromDate) {
      from = new Date(dto.fromDate);
      from.setHours(0, 0, 0, 0);
    }

    if (dto.toDate) {
      to = new Date(dto.toDate);
      to.setHours(23, 59, 59, 999);
    }

    let records: RecordShape[] = await model.find().lean();

    records = records.filter((r) => {
      const raw = this.getDate(r, dateField);
      if (!raw) return false;

      const d = new Date(raw);

      if (from && d < from) return false;
      if (to && d > to) return false;

      return true;
    });

    if (dto.tags?.length) {
      records = records.filter((r) =>
        (r.tags || []).some((t) => dto.tags!.includes(t)),
      );
    }

    console.log('Filtered records:', records.length);

    if (!records.length) {
      throw new BadRequestException(
        `No ${dto.type} found for selected filters`,
      );
    }

    const pdfBuffer = await this.generatePdf(records, dto.type);

    return this.bulkPdfModel.create({
      originalName: `${dto.type}-${dto.fromDate ?? 'all'}-to-${dto.toDate ?? 'all'}.pdf`,
      mimeType: 'application/pdf',
      size: pdfBuffer.length,
      data: pdfBuffer,

      description: dto.description ?? '',
      uploadedBy: dto.uploadedBy ?? '',
      type: dto.type,

      fromDate: from,
      toDate: to,

      tags: dto.tags ?? [],
      recordCount: records.length,
    });
  }

  async findAll() {
    return this.bulkPdfModel.find().select('-data').sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    const pdf = await this.bulkPdfModel.findById(id).select('-data');
    if (!pdf) throw new NotFoundException('PDF not found');
    return pdf;
  }

  async download(id: string) {
    const pdf = await this.bulkPdfModel.findById(id);
    if (!pdf) throw new NotFoundException('PDF not found');
    return pdf;
  }

  async remove(id: string) {
    const res = await this.bulkPdfModel.findByIdAndDelete(id);
    if (!res) throw new NotFoundException('PDF not found');
    return { message: 'Deleted successfully' };
  }

  async removeAll() {
    const res = await this.bulkPdfModel.deleteMany({});
    return { deleted: res.deletedCount };
  }
  async uploadMany(
  files: Express.Multer.File[],
  dto: CreateBulkPdfDto,
): Promise<BulkPdfDocument[]> {
  if (!files?.length) {
    throw new BadRequestException('No PDF files provided');
  }

  const docs = files.map((file) => ({
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    data: file.buffer,

    description: dto.description ?? '',
    uploadedBy: dto.uploadedBy ?? '',
    type: dto.type ?? null,

    fromDate: dto.fromDate ? new Date(dto.fromDate) : null,
    toDate: dto.toDate ? new Date(dto.toDate) : null,

    tags: dto.tags ?? [],
    recordCount: 0,
  }));

  return this.bulkPdfModel.insertMany(docs);
}
}
