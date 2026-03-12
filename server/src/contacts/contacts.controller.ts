import {
  Controller, Get, Post, Body, Param, Put, Delete,
  UseGuards, Request, Query, Res, UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiQuery, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type{ Response } from 'express';
import { ContactsService } from './contacts.service';
import { CreateContactDto, UpdateContactDto } from './dto/create-contact.dto';

@ApiTags('Contacts')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('contacts')
export class ContactsController {
  constructor(private service: ContactsService) {}

  @Post()
  create(@Body() dto: CreateContactDto, @Request() req) {
    return this.service.create(dto, req.user.userId);
  }

  @Get()
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive', 'lead', 'archived'] })
  findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  @Get('import/sample')
  @ApiOperation({ summary: 'Download sample CSV for contact import' })
  downloadSample(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="contacts_sample.csv"');
    res.send(this.service.getSampleCsv());
  }

  @Post('import')
  @ApiOperation({ summary: 'Import contacts from CSV (simulate=true for dry run)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiQuery({ name: 'simulate', required: false, type: Boolean })
  @UseInterceptors(FileInterceptor('file'))
  importContacts(
    @UploadedFile() file: Express.Multer.File,
    @Query('simulate') simulate: string,
    @Request() req,
  ) {
    return this.service.importContacts(file.buffer, req.user.userId, simulate === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateContactDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}