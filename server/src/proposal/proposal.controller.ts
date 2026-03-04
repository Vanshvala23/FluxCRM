import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProposalsService } from './proposal.service';
import { CreateProposalDto, UpdateProposalDto, ProposalQueryDto } from './dto/create-proposal.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('proposals')
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  // POST /proposals
  @Post()
  create(@Body() dto: CreateProposalDto, @Request() req) {
    return this.proposalsService.create(dto, req.user.id);
  }

  // GET /proposals
  @Get()
  findAll(@Query() query: ProposalQueryDto) {
    return this.proposalsService.findAll(query);
  }

  // GET /proposals/stats
  @Get('stats')
  getStats() {
    return this.proposalsService.getStats();
  }

  // GET /proposals/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.proposalsService.findOne(id);
  }

  // PUT /proposals/:id
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProposalDto) {
    return this.proposalsService.update(id, dto);
  }

  // DELETE /proposals/:id
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.proposalsService.remove(id);
  }

  // PATCH /proposals/:id/send
  @Patch(':id/send')
  markSent(@Param('id') id: string) {
    return this.proposalsService.markSent(id);
  }

  // PATCH /proposals/:id/view  (call this when client opens the proposal link)
  @Patch(':id/view')
  markViewed(@Param('id') id: string) {
    return this.proposalsService.markViewed(id);
  }

  // PATCH /proposals/:id/accept
  @Patch(':id/accept')
  accept(@Param('id') id: string) {
    return this.proposalsService.respond(id, 'accepted');
  }

  // PATCH /proposals/:id/reject
  @Patch(':id/reject')
  reject(@Param('id') id: string) {
    return this.proposalsService.respond(id, 'rejected');
  }
}