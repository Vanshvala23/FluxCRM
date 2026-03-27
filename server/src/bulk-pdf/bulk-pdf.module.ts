import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BulkPdfService } from './bulk-pdf.service';
import { BulkPdfController } from './bulk-pdf.controller';
import { BulkPdf, BulkPdfSchema } from './schemas/bulk-pdf-schema';
import { ProposalModule } from '../proposal/proposal.module';
import {InvoicesModule} from '../invoices/invoices.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BulkPdf.name, schema: BulkPdfSchema },
    ]),
    ProposalModule,
    InvoicesModule,
  ],
  controllers: [BulkPdfController],
  providers: [BulkPdfService],
  exports: [BulkPdfService],
})
export class BulkPdfModule {}