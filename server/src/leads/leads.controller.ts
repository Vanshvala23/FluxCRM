import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LeadsService } from './leads.service';

@ApiTags('Leads')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('leads')
export class LeadsController {
  constructor(private service: LeadsService) {}

  @Post() create(@Body() dto: any, @Request() req) { return this.service.create(dto, req.user.userId); }
  @Get() findAll(@Query() query: any) { return this.service.findAll(query); }
  @Get('stats') getStats() { return this.service.getStats(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Put(':id') update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}