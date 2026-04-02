import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { Contact, ContactSchema } from './schemas/contact.schema';
import { GroupModule } from '../group/group.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Contact.name, schema: ContactSchema },
    ]),
    GroupModule,
  ],
  controllers: [ContactsController],
  providers: [ContactsService],
  exports: [ContactsService, MongooseModule],
})
export class ContactsModule {}