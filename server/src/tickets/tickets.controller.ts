import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';

@ApiTags('Tickets')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('tickets')
export class TicketsController {
  constructor(private service: TicketsService) {}

  @Post()
  create(@Body() dto: any, @Request() req) {
    return this.service.create(dto, req.user.userId);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  // ⚠️ IMPORTANT: public BEFORE :id
  @Get('public')
  getPublicTickets() {
    return this.service.getPublicTickets();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  // 💬 REPLY
  @Post(':id/reply')
  reply(
    @Param('id') id: string,
    @Body() body: { message: string },
    @Request() req
  ) {
    return this.service.addReply(
      id,
      req.user.userId,
      body.message,
      'admin'
    );
  }

  // 🔘 TOGGLE PUBLIC
  @Put(':id/toggle-public')
  togglePublic(@Param('id') id: string) {
    return this.service.togglePublic(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}