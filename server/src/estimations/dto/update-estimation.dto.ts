import { PartialType } from '@nestjs/swagger';
import { CreateEstimationDto } from './create-estimation.dto';

export class UpdateEstimationDto extends PartialType(CreateEstimationDto) {}
