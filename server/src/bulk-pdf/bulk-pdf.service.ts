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

  private getCustomer(record: RecordShape): string {
    if (record.clientName) return record.clientName;
    if (typeof record.customer === 'object' && record.customer !== null) {
      return record.customer?.name ?? 'N/A';
    }
    return (record.customer as string) ?? 'N/A';
  }

  private async generatePdf(records: RecordShape[], type: string): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    for (const record of records) {
      const page = pdfDoc.addPage([595, 842]);
      let y = 800;

      const draw = (text: string, size = 12) => {
        // Sanitize text — pdf-lib throws on non-WinAnsi characters
        const safe = text.replace(/[^\x00-\xFF]/g, '?');
        page.drawText(safe, { x: 50, y, size, font, color: rgb(0, 0, 0) });
        y -= size + 8;
      };

      const number = record.invoiceNumber ?? record.proposalNumber ?? String(record._id);
      const rawDate = this.getDate(record, 'issueDate');
      const date = rawDate ? new Date(rawDate).toISOString().split('T')[0] : 'N/A';
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
            `${i + 1}. ${item.description || item.item || 'N/A'} | Qty: ${
              item.quantity ?? item.qty ?? 0
            } | Rs. ${item.amount ?? 0}`,
          );
        });
      } else {
        draw('No items');
      }

      draw('');
      draw(`Total: Rs. ${record.total ?? 0}`, 14);
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  async exportAndStore(dto: CreateBulkPdfDto): Promise<BulkPdfDocument> {
    if (!dto.type) throw new BadRequestException('type is required');

    const model = this.getModel(dto.type);
    const dateField = dto.type === 'invoices' ? 'issueDate' : 'proposalDate';

    const from: Date | null = dto.fromDate ? new Date(dto.fromDate) : null;
    const to: Date | null = dto.toDate ? new Date(dto.toDate) : null;

    if (from) from.setHours(0, 0, 0, 0);
    if (to) to.setHours(23, 59, 59, 999);

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
        (r.tags ?? []).some((t) => dto.tags!.includes(t)),
      );
    }

    if (!records.length) {
      throw new BadRequestException(`No ${dto.type} found for the given filters`);
    }

    const pdfBuffer = await this.generatePdf(records, dto.type);

    const filename = `${dto.type}-${dto.fromDate ?? 'all'}-to-${dto.toDate ?? 'all'}.pdf`;

    const created = await this.bulkPdfModel.create({
      originalName: filename,
      mimeType: 'application/pdf',
      size: pdfBuffer.length,
      data: pdfBuffer,           // ✅ plain Buffer — Mongoose stores as BSON Binary
      description: dto.description ?? '',
      uploadedBy: dto.uploadedBy ?? '',
      type: dto.type,
      fromDate: from,
      toDate: to,
      tags: dto.tags ?? [],
      recordCount: records.length,
    });

    return created;
  }

  async uploadMany(files: Express.Multer.File[], dto: CreateBulkPdfDto) {
    if (!files?.length) throw new BadRequestException('No PDF files provided');

    const docs = files.map((f) => ({
      originalName: f.originalname,
      mimeType: f.mimetype,
      size: f.size,
      data: Buffer.from(f.buffer), // ✅ ensure plain Buffer
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

  async findAll() {
    return this.bulkPdfModel.find().select('-data').sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    const pdf = await this.bulkPdfModel.findById(id).select('-data');
    if (!pdf) throw new NotFoundException('PDF not found');
    return pdf;
  }

  // ✅ Always explicitly select data field for download
  async download(id: string): Promise<BulkPdfDocument> {
    const pdf = await this.bulkPdfModel
      .findById(id)
      .select('+data +originalName +mimeType')
      .exec();

    if (!pdf) throw new NotFoundException('PDF not found');
    if (!pdf.data) throw new NotFoundException('PDF data is missing or corrupted');

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
}