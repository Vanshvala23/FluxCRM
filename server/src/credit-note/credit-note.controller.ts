import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CreditNoteService } from './credit-note.service';
import { CreateCreditNoteDto } from './dto/create-credit-note.dto';
import { UpdateCreditNoteDto } from './dto/update-credit-note.dto';

@Controller('credit-note')
export class CreditNoteController {
  constructor(private readonly creditNoteService: CreditNoteService) {}

  @Post()
  create(@Body() createCreditNoteDto: CreateCreditNoteDto) {
    return this.creditNoteService.create(createCreditNoteDto);
  }

  @Get()
  findAll() {
    return this.creditNoteService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.creditNoteService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCreditNoteDto: UpdateCreditNoteDto) {
    return this.creditNoteService.update(+id, updateCreditNoteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.creditNoteService.remove(+id);
  }
}
