import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Lead, LeadDocument } from './schemas/lead.schema';
import * as csv from 'csv-parse/sync';

// Matches Lead schema fields exactly — no phone (not in schema)
export const LEAD_IMPORTABLE_FIELDS = [
  'title',
  'contactName',
  'contactEmail',
  'company',
  'value',
  'status',
  'source',
  'notes',
] as const;

export interface ImportLeadsResult {
  totalRows: number;
  imported: number;
  skipped: number;
  failed: number;
  simulate: boolean;
  rows: {
    row: number;
    title: string;
    status: 'will_import' | 'imported' | 'duplicate' | 'invalid';
    reason?: string;
  }[];
}

@Injectable()
export class LeadsService {
  constructor(@InjectModel(Lead.name) private model: Model<LeadDocument>) {}

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  create(dto: any, userId: string) {
    return this.model.create({ ...dto, assignedTo: userId });
  }

  findAll(query: any = {}) {
    const filter: any = {};
    if (query.status) filter.status = query.status;
    if (query.search) filter.$or = [
      { title:       new RegExp(query.search, 'i') },
      { contactName: new RegExp(query.search, 'i') },
      { company:     new RegExp(query.search, 'i') },
    ];
    return this.model
      .find(filter)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).populate('assignedTo', 'name email');
    if (!doc) throw new NotFoundException('Lead not found');
    return doc;
  }

  async update(id: string, dto: any) {
    const doc = await this.model.findByIdAndUpdate(id, dto, { new: true });
    if (!doc) throw new NotFoundException('Lead not found');
    return doc;
  }

  async remove(id: string) {
    await this.model.findByIdAndDelete(id);
    return { message: 'Lead deleted' };
  }

  async getStats() {
    return this.model.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, totalValue: { $sum: '$value' } } },
    ]);
  }

  // ─── Import ───────────────────────────────────────────────────────────────

  getSampleCsv(): string {
    const headers = LEAD_IMPORTABLE_FIELDS.join(',');
    const example = [
      'Website Redesign Project',
      'John Doe',
      'john@acme.com',
      'Acme Corp',
      '5000',
      'new',
      'website',
      'Referred by Jane',
    ].join(',');
    return `${headers}\n${example}\n`;
  }

  async importLeads(
    fileBuffer: Buffer,
    userId: string,
    simulate = false,
  ): Promise<ImportLeadsResult> {
    // 1. Parse CSV
    let records: Record<string, string>[];
    try {
      records = csv.parse(fileBuffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
      });
    } catch (err) {
      throw new BadRequestException(`Could not parse CSV: ${err.message}`);
    }

    if (!records.length) {
      throw new BadRequestException('Not enough rows for importing');
    }

    // 2. Validate required headers
    const headers = Object.keys(records[0]);
    const missingHeaders = (['title', 'contactName'] as const).filter(
      (f) => !headers.includes(f),
    );
    if (missingHeaders.length) {
      throw new BadRequestException(
        `Missing required columns: ${missingHeaders.join(', ')}. ` +
        `Download the sample CSV for the correct format.`,
      );
    }

    // 3. Pre-fetch duplicates by title + contactName combo
    const existingDocs = await this.model
      .find({})
      .select('title contactName')
      .lean();

    const existingKeys = new Set(
      existingDocs.map(
        (d) => `${d.title?.toLowerCase()}__${d.contactName?.toLowerCase()}`,
      ),
    );

    // 4. Process rows
    const result: ImportLeadsResult = {
      totalRows: records.length,
      imported: 0,
      skipped:  0,
      failed:   0,
      simulate,
      rows:     [],
    };

    for (const [index, record] of records.entries()) {
      const rowNum      = index + 2;
      const title       = record.title?.trim();
      const contactName = record.contactName?.trim();
      const key         = `${title?.toLowerCase()}__${contactName?.toLowerCase()}`;

      // Missing required fields
      if (!title || !contactName) {
        result.rows.push({
          row: rowNum, title: title || '—',
          status: 'invalid',
          reason: 'Missing title or contactName',
        });
        result.failed++;
        continue;
      }

      // Value must be numeric if provided
      if (record.value && isNaN(Number(record.value))) {
        result.rows.push({
          row: rowNum, title,
          status: 'invalid',
          reason: `Invalid value "${record.value}" — must be a number`,
        });
        result.failed++;
        continue;
      }

      // Duplicate
      if (existingKeys.has(key)) {
        result.rows.push({
          row: rowNum, title,
          status: 'duplicate',
          reason: 'Title + contact combination already exists — skipped',
        });
        result.skipped++;
        continue;
      }

      // Simulate — report without writing
      if (simulate) {
        result.rows.push({ row: rowNum, title, status: 'will_import' });
        result.imported++;
        continue;
      }

      // Write — only schema fields, no phone
      await this.model.create({
        title,
        contactName,
        contactEmail: record.contactEmail?.trim() || undefined,
        company:      record.company?.trim()      || undefined,
        value:        record.value ? Number(record.value) : 0,
        status:       record.status?.trim()       || 'new',
        source:       record.source?.trim()       || undefined,
        notes:        record.notes?.trim()        || undefined,
        assignedTo:   userId,
      });

      existingKeys.add(key);
      result.rows.push({ row: rowNum, title, status: 'imported' });
      result.imported++;
    }

    return result;
  }
}