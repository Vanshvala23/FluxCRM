import { Module } from '@nestjs/common';
import { BulkPdfService } from './bulk-pdf.service';
import { BulkPdfController } from './bulk-pdf.controller';

@Module({
  controllers: [BulkPdfController],
  providers: [BulkPdfService],
})
export class BulkPdfModule {}
