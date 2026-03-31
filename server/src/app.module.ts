import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ContactsModule } from './contacts/contacts.module';
import { LeadsModule } from './leads/leads.module';
import { TicketsModule } from './tickets/tickets.module';
import {MongooseModule} from "@nestjs/mongoose";
import { ConfigModule } from '@nestjs/config';
import { ProposalModule } from './proposal/proposal.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { InvoicesModule } from './invoices/invoices.module';
import { CreditNoteModule } from './credit-note/credit-note.module';
import { EstimationsModule } from './estimations/estimations.module';
import { ItemsModule } from './items/items.module';
import { BulkPdfModule } from './bulk-pdf/bulk-pdf.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/fluxcrm'),
    AuthModule,
    UsersModule,
    ContactsModule,
    LeadsModule,
    TicketsModule,
    ProposalModule,
    ProjectsModule,
    TasksModule,
    InvoicesModule,
    CreditNoteModule,
    EstimationsModule,
    ItemsModule,
    BulkPdfModule,
    PaymentsModule,
  ],
  controllers: [AppController], 
  providers: [AppService],
})
export class AppModule {}
