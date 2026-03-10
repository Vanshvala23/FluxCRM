import { Module } from '@nestjs/common';
import { CreditNoteService } from './credit-note.service';
import { CreditNoteController } from './credit-note.controller';

@Module({
  controllers: [CreditNoteController],
  providers: [CreditNoteService],
})
export class CreditNoteModule {}
