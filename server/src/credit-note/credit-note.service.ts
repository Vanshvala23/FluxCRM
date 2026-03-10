import { Injectable } from '@nestjs/common';
import { CreateCreditNoteDto } from './dto/create-credit-note.dto';
import { UpdateCreditNoteDto } from './dto/update-credit-note.dto';

@Injectable()
export class CreditNoteService {
  create(createCreditNoteDto: CreateCreditNoteDto) {
    return 'This action adds a new creditNote';
  }

  findAll() {
    return `This action returns all creditNote`;
  }

  findOne(id: number) {
    return `This action returns a #${id} creditNote`;
  }

  update(id: number, updateCreditNoteDto: UpdateCreditNoteDto) {
    return `This action updates a #${id} creditNote`;
  }

  remove(id: number) {
    return `This action removes a #${id} creditNote`;
  }
}
