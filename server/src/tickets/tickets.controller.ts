import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';

@ApiTags('Tickets')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('tickets')
export class TicketsController {
  constructor(private service: TicketsService) {}

  @Post() create(@Body() dto: any, @Request() req) { return this.service.create(dto, req.user.userId); }
  @Get() findAll(@Query() query: any) { return this.service.findAll(query); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Put(':id') update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }
  @Post(':id/comments')
  addComment(@Param('id') id: string, @Body() body: { text: string }, @Request() req) {
    return this.service.addComment(id, req.user.userId, req.user.email, body.text);
  }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}