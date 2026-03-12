import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Contact, ContactDocument } from './schemas/contact.schema';
import { CreateContactDto, UpdateContactDto } from './dto/create-contact.dto';
import * as csv from 'csv-parse/sync';

export const CONTACT_IMPORTABLE_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'company',
  'jobTitle',
  'notes',
  'status',
] as const;

export interface ImportContactsResult {
  totalRows: number;
  imported: number;
  skipped: number;
  failed: number;
  simulate: boolean;
  rows: {
    row: number;
    email: string;
    status: 'will_import' | 'imported' | 'duplicate' | 'invalid';
    reason?: string;
  }[];
}

@Injectable()
export class ContactsService {
  constructor(
    @InjectModel(Contact.name) private model: Model<ContactDocument>,
  ) {}

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  create(dto: CreateContactDto, userId: string) {
    return this.model.create({ ...dto, assignedTo: userId });
  }

  findAll(query: any = {}) {
    const filter: any = {};

    if (query.search) {
      filter.$or = [
        { firstName: new RegExp(query.search, 'i') },
        { lastName:  new RegExp(query.search, 'i') },
        { email:     new RegExp(query.search, 'i') },
        { company:   new RegExp(query.search, 'i') },
      ];
    }

    if (query.status) filter.status = query.status;

    return this.model
      .find(filter)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).populate('assignedTo', 'name email');
    if (!doc) throw new NotFoundException('Contact not found');
    return doc;
  }

  async update(id: string, dto: UpdateContactDto) {
    const doc = await this.model.findByIdAndUpdate(id, dto, { new: true });
    if (!doc) throw new NotFoundException('Contact not found');
    return doc;
  }

  async remove(id: string) {
    const doc = await this.model.findByIdAndDelete(id);
    if (!doc) throw new NotFoundException('Contact not found');
    return { message: 'Contact deleted' };
  }

  // ─── Import ───────────────────────────────────────────────────────────────

  getSampleCsv(): string {
    const headers = CONTACT_IMPORTABLE_FIELDS.join(',');
    const example = [
      'Jane', 'Smith', 'jane@example.com',
      '+1-555-123-4567', 'Acme Corp', 'Product Manager',
      'Met at conference', 'active',
    ].join(',');
    return `${headers}\n${example}\n`;
  }

  async importContacts(
    fileBuffer: Buffer,
    userId: string,
    simulate = false,
  ): Promise<ImportContactsResult> {
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

    // 2. Validate required headers exist
    const headers = Object.keys(records[0]);
    const missingHeaders = (['firstName', 'lastName', 'email'] as const).filter(
      (f) => !headers.includes(f),
    );
    if (missingHeaders.length) {
      throw new BadRequestException(
        `Missing required columns: ${missingHeaders.join(', ')}. ` +
        `Download the sample CSV for the correct format.`,
      );
    }

    // 3. Pre-fetch existing emails to detect duplicates before writing anything
    const incomingEmails = records
      .map((r) => r.email?.toLowerCase().trim())
      .filter(Boolean);

    const existingDocs = await this.model
      .find({ email: { $in: incomingEmails } })
      .select('email')
      .lean();

    const existingEmails = new Set(
      existingDocs.map((d) => d.email.toLowerCase()),
    );

    // 4. Process each row
    const result: ImportContactsResult = {
      totalRows: records.length,
      imported: 0,
      skipped:  0,
      failed:   0,
      simulate,
      rows:     [],
    };

    for (const [index, record] of records.entries()) {
      const rowNum = index + 2; // +2 — row 1 is the header
      const email  = record.email?.toLowerCase().trim();

      // Missing required fields
      if (!record.firstName?.trim() || !record.lastName?.trim() || !email) {
        result.rows.push({
          row: rowNum, email: email || '—',
          status: 'invalid',
          reason: 'Missing firstName, lastName, or email',
        });
        result.failed++;
        continue;
      }

      // Bad email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        result.rows.push({
          row: rowNum, email,
          status: 'invalid',
          reason: 'Invalid email address',
        });
        result.failed++;
        continue;
      }

      // Duplicate — skip silently like Perfex
      if (existingEmails.has(email)) {
        result.rows.push({
          row: rowNum, email,
          status: 'duplicate',
          reason: 'Email already exists — skipped',
        });
        result.skipped++;
        continue;
      }

      // Simulate mode — report outcome without writing
      if (simulate) {
        result.rows.push({ row: rowNum, email, status: 'will_import' });
        result.imported++;
        continue;
      }

      // Write to DB
      await this.model.create({
        firstName:  record.firstName.trim(),
        lastName:   record.lastName.trim(),
        email,
        phone:      record.phone?.trim()    || undefined,
        company:    record.company?.trim()  || undefined,
        jobTitle:   record.jobTitle?.trim() || undefined,
        notes:      record.notes?.trim()    || undefined,
        status:     record.status?.trim()   || 'active',
        assignedTo: userId,
      });

      // Add to set so duplicate rows within the same file are also caught
      existingEmails.add(email);

      result.rows.push({ row: rowNum, email, status: 'imported' });
      result.imported++;
    }

    return result;
  }
}