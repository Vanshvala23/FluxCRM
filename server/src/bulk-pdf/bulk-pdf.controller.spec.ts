import { Test, TestingModule } from '@nestjs/testing';
import { BulkPdfController } from './bulk-pdf.controller';
import { BulkPdfService } from './bulk-pdf.service';

describe('BulkPdfController', () => {
  let controller: BulkPdfController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BulkPdfController],
      providers: [BulkPdfService],
    }).compile();

    controller = module.get<BulkPdfController>(BulkPdfController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
