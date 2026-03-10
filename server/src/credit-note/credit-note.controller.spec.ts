import { Test, TestingModule } from '@nestjs/testing';
import { CreditNoteController } from './credit-note.controller';
import { CreditNoteService } from './credit-note.service';

describe('CreditNoteController', () => {
  let controller: CreditNoteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreditNoteController],
      providers: [CreditNoteService],
    }).compile();

    controller = module.get<CreditNoteController>(CreditNoteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
