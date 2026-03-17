import { Module } from '@nestjs/common';
import {MongooseModule} from '@nestjs/mongoose';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import {Invoice, InvoiceSchema } from './schemas/invoice-schema';
import { ItemsModule } from '../items/items.module';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Invoice.name, schema: InvoiceSchema }]),
    ItemsModule,
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports:[InvoicesService]
})
export class InvoicesModule {}
