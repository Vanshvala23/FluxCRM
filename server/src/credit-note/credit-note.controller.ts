import {
  Controller, Get, Post, Body, Patch,
  Param, Delete, UseGuards,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation,
  ApiParam, ApiResponse,
} from '@nestjs/swagger';
import { CreditNoteService } from './credit-note.service';
import { CreateCreditNoteDto } from './dto/create-credit-note.dto';
import { UpdateCreditNoteDto } from './dto/update-credit-note.dto';
import { JwtAuthGuard } from '../auth/jwt.auth.guard'; // adjust path if needed

@ApiTags('Credit Notes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('credit-note')
export class CreditNoteController {
  constructor(private readonly creditNoteService: CreditNoteService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new credit note' })
  @ApiResponse({ status: 201, description: 'Credit note created successfully' })
  create(@Body() createCreditNoteDto: CreateCreditNoteDto) {
    return this.creditNoteService.create(createCreditNoteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all credit notes' })
  @ApiResponse({ status: 200, description: 'Returns all credit notes' })
  findAll() {
    return this.creditNoteService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a credit note by ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the credit note' })
  @ApiResponse({ status: 200, description: 'Returns the credit note' })
  @ApiResponse({ status: 404, description: 'Credit note not found' })
  findOne(@Param('id') id: string) {
    return this.creditNoteService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a credit note' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the credit note' })
  @ApiResponse({ status: 200, description: 'Credit note updated successfully' })
  @ApiResponse({ status: 404, description: 'Credit note not found' })
  update(@Param('id') id: string, @Body() updateCreditNoteDto: UpdateCreditNoteDto) {
    return this.creditNoteService.update(id, updateCreditNoteDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a credit note' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the credit note' })
  @ApiResponse({ status: 200, description: 'Credit note deleted successfully' })
  @ApiResponse({ status: 404, description: 'Credit note not found' })
  remove(@Param('id') id: string) {
    return this.creditNoteService.remove(id);
  }
}