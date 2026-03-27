import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BulkPdf, BulkPdfDocument } from './schemas/bulk-pdf-schema';
import { CreateBulkPdfDto } from './dto/create-bulk-pdf.dto';

const INVOICE_MODEL = 'Invoice';
const PROPOSAL_MODEL = 'Proposal';

interface RecordShape {
  _id: string;
  invoiceNumber?: string;
  proposalNumber?: string;
  customer?: string | { name?: string };
  issueDate?:any;
  invoiceDate?: any;   // 👈 allow string OR Date
  proposalDate?: any;
  total?: number;
  currency?: string;
  items?: { item: string; qty: number; rate: number; amount: number }[];
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

  // ─── Pick model ─────────────────────────────────────────
  private getModel(type: string): Model<any> {
    if (type === 'invoices') return this.invoiceModel;
    if (type === 'proposals') return this.proposalModel;
    throw new BadRequestException(`Unsupported export type: "${type}"`);
  }

  // ─── Normalize Date (CRITICAL FIX) ──────────────────────
  private normalizeDate(date: any): Date {
    return new Date(date);
  }

  // ─── HTML generator ─────────────────────────────────────
  private recordToHtml(record: RecordShape, type: string): string {
    const number = record.invoiceNumber ?? record.proposalNumber ?? record._id;

    const rawDate = record.invoiceDate ?? record.proposalDate;
    const date = rawDate ? new Date(rawDate).toISOString().split('T')[0] : 'N/A';

    const customer =
      typeof record.customer === 'object'
        ? record.customer?.name ?? 'N/A'
        : record.customer ?? 'N/A';

    const itemRows = (record.items ?? [])
      .map(
        (it) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${it.item}</td>
        <td style="padding:8px;text-align:center">${it.qty}</td>
        <td style="padding:8px;text-align:right">₹${it.rate}</td>
        <td style="padding:8px;text-align:right">₹${it.amount}</td>
      </tr>`
      )
      .join('');

    return `
    <div style="page-break-after:always;padding:40px;font-family:sans-serif">
      <h2>${type.toUpperCase()} #${number}</h2>
      <p><b>Customer:</b> ${customer}</p>
      <p><b>Date:</b> ${date}</p>

      ${
        itemRows
          ? `<table style="width:100%;border-collapse:collapse">${itemRows}</table>`
          : '<p>No items</p>'
      }

      <h3 style="text-align:right">Total: ₹${record.total ?? 0}</h3>
    </div>`;
  }

  // ─── MAIN EXPORT FIXED ──────────────────────────────────
  async exportAndStore(dto: CreateBulkPdfDto): Promise<BulkPdfDocument> {
    if (!dto.type) throw new BadRequestException('type is required');

    const puppeteer = require('puppeteer');

    const model = this.getModel(dto.type);
   const dateField = dto.type === 'invoices' ? 'issueDate' : 'proposalDate';

    // ✅ Convert filter dates
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

    // ❗ IMPORTANT: If DB stores string → Mongo query may fail
    // So we fetch ALL (or partial) then filter manually

    let records: RecordShape[] = await model.find().lean();

    // ✅ Apply filtering in JS (SAFE for string + Date)
    records = records.filter((r) => {
  const raw =
    r.issueDate ||
    r.invoiceDate ||
    r.proposalDate;

  if (!raw) return false;

  const recordDate = new Date(raw);

  if (from && recordDate < from) return false;
  if (to && recordDate > to) return false;

  return true;
});

    // ✅ Optional TAG filter
    if (dto.tags && dto.tags.length > 0) {
      records = records.filter((r) =>
        (r.tags || []).some((tag) => dto.tags!.includes(tag))
      );
    }

    console.log('Filtered records:', records.length);

    if (records.length === 0) {
      throw new BadRequestException(
        `No ${dto.type} found for the selected filters`,
      );
    }

    // ─── Generate HTML ─────────────────────────
    const html = `
    <html>
      <body>
        ${records.map((r) => this.recordToHtml(r, dto.type!)).join('')}
      </body>
    </html>`;

    // ─── Generate PDF ─────────────────────────
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer: Buffer = await page.pdf({
      format: 'A4',
      printBackground: true,
    });

    await browser.close();

    // ─── Save ─────────────────────────
    return this.bulkPdfModel.create({
      originalName: `${dto.type}-${dto.fromDate}-to-${dto.toDate}.pdf`,
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

  // ─── Other methods unchanged ─────────────────────────
  async uploadMany(files: Express.Multer.File[], dto: CreateBulkPdfDto) {
    if (!files?.length) throw new BadRequestException('No PDF files');

    return this.bulkPdfModel.insertMany(
      files.map((f) => ({
        originalName: f.originalname,
        mimeType: f.mimetype,
        size: f.size,
        data: f.buffer,
        description: dto.description ?? '',
        uploadedBy: dto.uploadedBy ?? '',
        type: dto.type ?? null,
        fromDate: dto.fromDate ? new Date(dto.fromDate) : null,
        toDate: dto.toDate ? new Date(dto.toDate) : null,
        tags: dto.tags ?? [],
        recordCount: 0,
      })),
    );
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
}