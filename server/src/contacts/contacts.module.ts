import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { Contact, ContactSchema } from './schemas/contact.schema';
import { Group, GroupSchema } from '../group/schemas/group-schema';
import { GroupService } from '../group/group.service';
import { GroupController } from '../group/group.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Contact.name, schema: ContactSchema },
      { name: Group.name,   schema: GroupSchema   }, // ✅ register Group model
    ]),
  ],
  controllers: [ContactsController, GroupController],
  providers:   [ContactsService,    GroupService],
  exports:     [ContactsService, MongooseModule],
})
export class ContactsModule {}