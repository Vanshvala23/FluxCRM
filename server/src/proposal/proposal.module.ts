import { Module } from '@nestjs/common';
import { ProposalsService } from './proposal.service';
import { ProposalsController } from './proposal.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {Proposal,ProposalSchema} from './schemas/proposal.schema';
import { ItemsModule } from '../items/items.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Proposal.name, schema: ProposalSchema }]),
    ItemsModule,
  ],
  controllers: [ProposalsController],
  providers: [ProposalsService],
  exports: [ProposalsService,MongooseModule]
})
export class ProposalModule {}
