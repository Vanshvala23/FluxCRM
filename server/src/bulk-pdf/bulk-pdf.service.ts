import { Injectable } from '@nestjs/common';
import { CreateBulkPdfDto } from './dto/create-bulk-pdf.dto';
import { UpdateBulkPdfDto } from './dto/update-bulk-pdf.dto';

@Injectable()
export class BulkPdfService {
  create(createBulkPdfDto: CreateBulkPdfDto) {
    return 'This action adds a new bulkPdf';
  }

  findAll() {
    return `This action returns all bulkPdf`;
  }

  findOne(id: number) {
    return `This action returns a #${id} bulkPdf`;
  }

  update(id: number, updateBulkPdfDto: UpdateBulkPdfDto) {
    return `This action updates a #${id} bulkPdf`;
  }

  remove(id: number) {
    return `This action removes a #${id} bulkPdf`;
  }
}
