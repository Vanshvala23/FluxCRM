import { Test, TestingModule } from '@nestjs/testing';
import { EstimationsService } from './estimations.service';

describe('EstimationsService', () => {
  let service: EstimationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EstimationsService],
    }).compile();

    service = module.get<EstimationsService>(EstimationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
