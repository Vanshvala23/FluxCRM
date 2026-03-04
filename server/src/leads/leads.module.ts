import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { Lead, LeadSchema } from './schemas/lead.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Lead.name, schema: LeadSchema }])],
  providers: [LeadsService],
  controllers: [LeadsController],
})
export class LeadsModule {}