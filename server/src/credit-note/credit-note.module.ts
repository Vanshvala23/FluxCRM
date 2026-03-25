import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CreditNoteService } from './credit-note.service';
import { CreditNoteController } from './credit-note.controller';
import { CreditNote, CreditNoteSchema } from './schemas/credit-note-schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CreditNote.name, schema: CreditNoteSchema },
    ]),
  ],
  controllers: [CreditNoteController],
  providers: [CreditNoteService],
  exports: [CreditNoteService],
})
export class CreditNoteModule {}