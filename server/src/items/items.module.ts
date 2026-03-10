import { Module } from '@nestjs/common';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import {Item, ItemSchema } from './schemas/item-schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Item.name, schema: ItemSchema }]),
  ],
  controllers: [ItemsController],
  providers: [ItemsService],
  exports:[ItemsService]
})
export class ItemsModule {}
