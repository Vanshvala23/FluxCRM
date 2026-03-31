import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentService } from './payments.service';
import { PaymentController } from './payments.controller';
import { Payment, PaymentSchema } from './schemas/payment.shema';
import { InvoicesModule } from '../invoices/invoices.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
    ]),
    InvoicesModule, // ✅ gives access to Invoice model via @InjectModel('Invoice')
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService, MongooseModule],
})
export class PaymentsModule {}