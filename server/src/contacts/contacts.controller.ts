import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';

@ApiTags('Contacts')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('contacts')
export class ContactsController {
  constructor(private service: ContactsService) {}

  @Post() create(@Body() dto: CreateContactDto, @Request() req) {
    return this.service.create(dto, req.user.userId);
  }

  @Get()
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive'] })
  findAll(@Query() query: any) { return this.service.findAll(query); }

  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Put(':id') update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}