import { PartialType } from '@nestjs/swagger';
import { CreateCreditNoteDto } from './create-credit-note.dto';

export class UpdateCreditNoteDto extends PartialType(CreateCreditNoteDto) {}
