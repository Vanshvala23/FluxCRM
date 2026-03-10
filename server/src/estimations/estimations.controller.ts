import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EstimationsService } from './estimations.service';
import { CreateEstimationDto } from './dto/create-estimation.dto';
import { UpdateEstimationDto } from './dto/update-estimation.dto';

@Controller('estimations')
export class EstimationsController {
  constructor(private readonly estimationsService: EstimationsService) {}

  @Post()
  create(@Body() createEstimationDto: CreateEstimationDto) {
    return this.estimationsService.create(createEstimationDto);
  }

  @Get()
  findAll() {
    return this.estimationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.estimationsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEstimationDto: UpdateEstimationDto) {
    return this.estimationsService.update(+id, updateEstimationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.estimationsService.remove(+id);
  }
}
