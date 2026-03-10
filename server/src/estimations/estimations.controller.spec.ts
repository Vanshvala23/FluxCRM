import { Test, TestingModule } from '@nestjs/testing';
import { EstimationsController } from './estimations.controller';
import { EstimationsService } from './estimations.service';

describe('EstimationsController', () => {
  let controller: EstimationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EstimationsController],
      providers: [EstimationsService],
    }).compile();

    controller = module.get<EstimationsController>(EstimationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
