import { Test, TestingModule } from '@nestjs/testing';
import { BulkPdfService } from './bulk-pdf.service';

describe('BulkPdfService', () => {
  let service: BulkPdfService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BulkPdfService],
    }).compile();

    service = module.get<BulkPdfService>(BulkPdfService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
