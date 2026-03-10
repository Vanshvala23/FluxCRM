import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskDocument } from './schemas/task.schema';
import { CreateTaskDto, UpdateTaskDto, TaskFilterDto } from './dto/create-task.dto';

@Injectable()
export class TaskService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: string): Promise<TaskDocument> {
    const newTask = new this.taskModel({
      ...createTaskDto,
      createdBy: new Types.ObjectId(userId),
      startDate: new Date(createTaskDto.startDate),
      dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : undefined,
    });

    return newTask.save();
  }

  async findAll(
    userId: string,
    filter?: TaskFilterDto,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: TaskDocument[]; total: number; page: number; limit: number }> {
    const query: any = {
      $or: [
        { createdBy: new Types.ObjectId(userId) },
        { assignees: new Types.ObjectId(userId) },
        { followers: new Types.ObjectId(userId) },
        { visibility: 'public' },
      ],
    };

    // Apply filters
    if (filter?.status) {
      query.status = filter.status;
    }
    if (filter?.priority) {
      query.priority = filter.priority;
    }
    if (filter?.assigneeId) {
      query.assignees = new Types.ObjectId(filter.assigneeId);
    }
    if (filter?.billable !== undefined) {
      query.billable = filter.billable;
    }
    if (filter?.search) {
      query.$or = [
        { subject: { $regex: filter.search, $options: 'i' } },
        { description: { $regex: filter.search, $options: 'i' } },
        { tags: { $in: [new RegExp(filter.search, 'i')] } },
      ];
    }
    if (filter?.relatedId) {
      query.relatedId = new Types.ObjectId(filter.relatedId);
    }

    const total = await this.taskModel.countDocuments(query);
    const skip = (page - 1) * limit;

    const data = await this.taskModel
      .find(query)
      .populate('createdBy', 'firstName lastName email')
      .populate('assignees', 'firstName lastName email')
      .populate('followers', 'firstName lastName email')
      .populate('completedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return { data, total, page, limit };
  }

  async findById(id: string): Promise<TaskDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid task ID');
    }

    const task = await this.taskModel
      .findById(id)
      .populate('createdBy', 'firstName lastName email')
      .populate('assignees', 'firstName lastName email')
      .populate('followers', 'firstName lastName email')
      .populate('completedBy', 'firstName lastName email');

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string): Promise<TaskDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid task ID');
    }

    const task = await this.taskModel.findById(id);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Only creator or assignees can update
    const isCreator = task.createdBy.toString() === userId;
    const isAssignee = task.assignees.some(a => a.toString() === userId);

    if (!isCreator && !isAssignee) {
      throw new BadRequestException('You do not have permission to update this task');
    }

    Object.assign(task, updateTaskDto);

    if (updateTaskDto.dueDate) {
      task.dueDate = new Date(updateTaskDto.dueDate);
    }

    return task.save();
  }

  async delete(id: string, userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid task ID');
    }

    const task = await this.taskModel.findById(id);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Only creator can delete
    if (task.createdBy.toString() !== userId) {
      throw new BadRequestException('Only task creator can delete this task');
    }

    await this.taskModel.findByIdAndDelete(id);
  }

  async completeTask(id: string, userId: string, actualHours?: number): Promise<TaskDocument> {
    const task = await this.findById(id);

    task.status = 'completed';
    task.completedAt = new Date();
    task.completedBy = new Types.ObjectId(userId);
    task.progress = 100;

    if (actualHours !== undefined) {
      task.actualHours = actualHours;
    }

    return task.save();
  }

  async updateProgress(id: string, progress: number): Promise<TaskDocument> {
    if (progress < 0 || progress > 100) {
      throw new BadRequestException('Progress must be between 0 and 100');
    }

    const task = await this.findById(id);
    task.progress = progress;

    if (progress === 100 && task.status !== 'completed') {
      task.status = 'completed';
      task.completedAt = new Date();
    }

    return task.save();
  }

  async addChecklist(id: string, checklistItems: Array<{ text: string; completed?: boolean }>): Promise<TaskDocument> {
    const task = await this.findById(id);

    const newItems = checklistItems.map(item => ({
      _id: new Types.ObjectId(),
      text: item.text,
      completed: item.completed || false,
    }));

    task.checklist = [...task.checklist, ...newItems];
    return task.save();
  }

  async updateChecklistItem(id: string, itemId: string, text?: string, completed?: boolean): Promise<TaskDocument> {
    const task = await this.findById(id);

    const item = task.checklist.find(c => c._id.toString() === itemId);
    if (!item) {
      throw new NotFoundException('Checklist item not found');
    }

    if (text !== undefined) {
      item.text = text;
    }
    if (completed !== undefined) {
      item.completed = completed;
    }

    return task.save();
  }

  async removeChecklistItem(id: string, itemId: string): Promise<TaskDocument> {
    const task = await this.findById(id);
    task.checklist = task.checklist.filter(c => c._id.toString() !== itemId);
    return task.save();
  }

  async addFollower(id: string, userId: string): Promise<TaskDocument> {
    const task = await this.findById(id);

    if (!task.followers.some(f => f.toString() === userId)) {
      task.followers.push(new Types.ObjectId(userId));
    }

    return task.save();
  }

  async removeFollower(id: string, userId: string): Promise<TaskDocument> {
    const task = await this.findById(id);
    task.followers = task.followers.filter(f => f.toString() !== userId);
    return task.save();
  }

  async getTasksByProject(projectId: string): Promise<TaskDocument[]> {
    return this.taskModel
      .find({ relatedType: 'project', relatedId: new Types.ObjectId(projectId) })
      .populate('assignees', 'firstName lastName email')
      .sort({ createdAt: -1 });
  }

  async getTasksByCustomer(customerId: string): Promise<TaskDocument[]> {
    return this.taskModel
      .find({ relatedType: 'customer', relatedId: new Types.ObjectId(customerId) })
      .populate('assignees', 'firstName lastName email')
      .sort({ createdAt: -1 });
  }

  async getTaskStatistics(userId: string): Promise<any> {
    const userObjectId = new Types.ObjectId(userId);

    const stats = await this.taskModel.aggregate([
      {
        $match: {
          $or: [
            { createdBy: userObjectId },
            { assignees: userObjectId },
          ],
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const billableStats = await this.taskModel.aggregate([
      {
        $match: {
          billable: true,
          status: 'completed',
          $or: [
            { createdBy: userObjectId },
            { assignees: userObjectId },
          ],
        },
      },
      {
        $group: {
          _id: null,
          totalHours: { $sum: '$actualHours' },
          totalRevenue: {
            $sum: { $multiply: ['$actualHours', '$hourlyRate'] },
          },
        },
      },
    ]);

    return {
      byStatus: stats,
      billable: billableStats[0] || { totalHours: 0, totalRevenue: 0 },
    };
  }
}