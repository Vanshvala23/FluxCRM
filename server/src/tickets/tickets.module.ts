import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { Ticket, TicketSchema } from './schemas/ticket.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Ticket.name, schema: TicketSchema }])],
  providers: [TicketsService],
  controllers: [TicketsController],
})
export class TicketsModule {}