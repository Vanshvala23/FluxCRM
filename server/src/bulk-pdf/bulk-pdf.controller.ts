import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BulkPdfService } from './bulk-pdf.service';
import { CreateBulkPdfDto } from './dto/create-bulk-pdf.dto';
import { UpdateBulkPdfDto } from './dto/update-bulk-pdf.dto';

@Controller('bulk-pdf')
export class BulkPdfController {
  constructor(private readonly bulkPdfService: BulkPdfService) {}

  @Post()
  create(@Body() createBulkPdfDto: CreateBulkPdfDto) {
    return this.bulkPdfService.create(createBulkPdfDto);
  }

  @Get()
  findAll() {
    return this.bulkPdfService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bulkPdfService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBulkPdfDto: UpdateBulkPdfDto) {
    return this.bulkPdfService.update(+id, updateBulkPdfDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bulkPdfService.remove(+id);
  }
}
