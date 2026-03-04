import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';
import { CreateProjectDto, UpdateProjectDto, ProjectQueryDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
  ) {}

  // ── Create ──────────────────────────────────────────────────────────────────

  async create(dto: CreateProjectDto, createdBy: string): Promise<ProjectDocument> {
    const project = new this.projectModel({
      ...dto,
      manager: dto.manager || createdBy,   // default manager = creator
    });
    return project.save();
  }

  // ── Find All (with filters + pagination) ────────────────────────────────────

  async findAll(query: ProjectQueryDto) {
    const { search, status, priority, client, manager, page = 1, limit = 20 } = query;
    const filter: any = {};

    if (status)   filter.status   = status;
    if (priority) filter.priority = priority;
    if (client)   filter.client   = new Types.ObjectId(client);
    if (manager)  filter.manager  = new Types.ObjectId(manager);

    if (search) {
      filter.$or = [
        { name:        { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags:        { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.projectModel
        .find(filter)
        .populate('client',  'firstName lastName email name')
        .populate('manager', 'firstName lastName email')
        .populate('members', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.projectModel.countDocuments(filter),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Find One ─────────────────────────────────────────────────────────────────

  async findOne(id: string): Promise<ProjectDocument> {
    this.validateId(id);
    const project = await this.projectModel
      .findById(id)
      .populate('client',  'firstName lastName email name phone')
      .populate('manager', 'firstName lastName email')
      .populate('members', 'firstName lastName email');

    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  // ── Update ───────────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateProjectDto): Promise<ProjectDocument> {
    this.validateId(id);

    // Auto-set completedAt when status flips to completed
    if (dto.status === 'completed') {
      (dto as any).completedAt = new Date();
    }

    const project = await this.projectModel
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .populate('client',  'firstName lastName email name')
      .populate('manager', 'firstName lastName email')
      .populate('members', 'firstName lastName email');

    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  // ── Update Progress ──────────────────────────────────────────────────────────

  async updateProgress(id: string, progress: number): Promise<ProjectDocument> {
    this.validateId(id);
    if (progress < 0 || progress > 100) {
      throw new BadRequestException('Progress must be between 0 and 100');
    }
    const update: any = { progress };
    if (progress === 100) {
      update.status      = 'completed';
      update.completedAt = new Date();
    }
    const project = await this.projectModel
      .findByIdAndUpdate(id, update, { new: true })
      .populate('client',  'firstName lastName email name')
      .populate('manager', 'firstName lastName email');

    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  // ── Delete ───────────────────────────────────────────────────────────────────

  async remove(id: string): Promise<{ deleted: boolean }> {
    this.validateId(id);
    const result = await this.projectModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException(`Project ${id} not found`);
    return { deleted: true };
  }

  // ── Stats ────────────────────────────────────────────────────────────────────

  async getStats() {
    const [statusCounts, priorityCounts, totals] = await Promise.all([
      // Count by status
      this.projectModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // Count by priority
      this.projectModel.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),

      // Budget / spent totals + avg progress
      this.projectModel.aggregate([
        {
          $group: {
            _id: null,
            totalBudget:   { $sum: '$budget' },
            totalSpent:    { $sum: '$spent' },
            avgProgress:   { $avg: '$progress' },
            totalProjects: { $sum: 1 },
          },
        },
      ]),
    ]);

    const byStatus   = Object.fromEntries(statusCounts.map(s => [s._id, s.count]));
    const byPriority = Object.fromEntries(priorityCounts.map(p => [p._id, p.count]));
    const summary    = totals[0] || { totalBudget: 0, totalSpent: 0, avgProgress: 0, totalProjects: 0 };

    return {
      byStatus,
      byPriority,
      totalProjects:  summary.totalProjects,
      totalBudget:    summary.totalBudget,
      totalSpent:     summary.totalSpent,
      avgProgress:    Math.round(summary.avgProgress || 0),
      overBudget:     await this.projectModel.countDocuments({ $expr: { $gt: ['$spent', '$budget'] } }),
      overdue:        await this.projectModel.countDocuments({
        dueDate: { $lt: new Date() },
        status:  { $nin: ['completed', 'cancelled'] },
      }),
    };
  }

  // ── Helper ───────────────────────────────────────────────────────────────────

  private validateId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid project ID: ${id}`);
    }
  }
}