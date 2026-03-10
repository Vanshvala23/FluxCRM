import { Injectable } from '@nestjs/common';
import { CreateEstimationDto } from './dto/create-estimation.dto';
import { UpdateEstimationDto } from './dto/update-estimation.dto';

@Injectable()
export class EstimationsService {
  create(createEstimationDto: CreateEstimationDto) {
    return 'This action adds a new estimation';
  }

  findAll() {
    return `This action returns all estimations`;
  }

  findOne(id: number) {
    return `This action returns a #${id} estimation`;
  }

  update(id: number, updateEstimationDto: UpdateEstimationDto) {
    return `This action updates a #${id} estimation`;
  }

  remove(id: number) {
    return `This action removes a #${id} estimation`;
  }
}
