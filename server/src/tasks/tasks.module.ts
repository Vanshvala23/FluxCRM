import { Module } from '@nestjs/common';
import { TaskService } from './tasks.service';
import { TaskController } from './tasks.controller';
import {MongooseModule} from '@nestjs/mongoose'
import {Task,TaskSchema} from './schemas/task.schema'

@Module({
  imports: [MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }])],
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TaskService]
})
export class TasksModule {}
