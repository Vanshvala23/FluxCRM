import { IsString, IsOptional, IsDate, IsBoolean, IsNumber, IsEnum, IsArray, ValidateNested, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

// ─── Nested DTOs ──────────────────────────────────────────────────────────────

export class ChecklistItemDto {
  @IsString()
  text: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean = false;
}

export class UserRefDto {
  _id: string;
  name: string;
  email: string;
}

export class ChecklistResponseDto {
  _id: string;
  text: string;
  completed: boolean;
}

// ─── Create Task ──────────────────────────────────────────────────────────────

export class CreateTaskDto {
  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(['low', 'medium', 'high', 'urgent'])
  @IsOptional()
  priority?: string = 'medium';

  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dueDate?: Date;

  @IsOptional()
  @IsBoolean()
  billable?: boolean = false;

  @IsOptional()
  @IsNumber()
  hourlyRate?: number;

  @IsOptional()
  @IsString()
  visibility?: string = 'private'; // 'public' | 'private'

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(['none', 'weekly', 'biweekly', 'monthly', 'bimonthly', 'quarterly', 'yearly', 'custom'])
  recurrencePattern?: string = 'none';

  @IsOptional()
  @IsString()
  customRecurrence?: string;

  @IsOptional()
  @IsEnum(['project', 'invoice', 'customer', 'estimate', 'contract', 'ticket', 'expense', 'lead', 'proposal'])
  relatedType?: string;

  @IsOptional()
  @IsMongoId()
  relatedId?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  assignees?: string[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  followers?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  checklist?: ChecklistItemDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @IsOptional()
  @IsNumber()
  estimatedHours?: number = 0;

  @IsOptional()
  @IsNumber()
  progress?: number = 0;
}

// ─── Update Task ──────────────────────────────────────────────────────────────

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  priority?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dueDate?: Date;

  @IsOptional()
  @IsEnum(['pending', 'in_progress', 'completed', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsBoolean()
  billable?: boolean;

  @IsOptional()
  @IsNumber()
  hourlyRate?: number;

  @IsOptional()
  @IsString()
  visibility?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  assignees?: string[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  followers?: string[];

  @IsOptional()
  @IsNumber()
  actualHours?: number;

  @IsOptional()
  @IsNumber()
  progress?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  checklist?: ChecklistItemDto[];

  @IsOptional()
  @IsEnum(['none', 'weekly', 'biweekly', 'monthly', 'bimonthly', 'quarterly', 'yearly', 'custom'])
  recurrencePattern?: string;

  @IsOptional()
  @IsString()
  customRecurrence?: string;
}

// ─── Filter Task ──────────────────────────────────────────────────────────────

export class TaskFilterDto {
  @IsOptional()
  @IsEnum(['pending', 'in_progress', 'completed', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  priority?: string;

  @IsOptional()
  @IsMongoId()
  assigneeId?: string;

  @IsOptional()
  @IsBoolean()
  billable?: boolean;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsMongoId()
  relatedId?: string;

  @IsOptional()
  @IsEnum(['project', 'invoice', 'customer', 'estimate', 'contract', 'ticket', 'expense', 'lead', 'proposal'])
  relatedType?: string;
}

// ─── Response DTO ──────────────────────────────────────────────────────────────

export class TaskResponseDto {
  _id: string;
  subject: string;
  description?: string;
  priority: string;
  startDate: Date;
  dueDate?: Date;
  status: string;
  billable: boolean;
  hourlyRate?: number;
  visibility: string;
  tags: string[];
  createdBy?: UserRefDto;
  assignees: UserRefDto[];
  followers: UserRefDto[];
  completedBy?: UserRefDto;
  recurrencePattern: string;
  customRecurrence?: string;
  relatedType?: string;
  relatedId?: string;
  checklist: ChecklistResponseDto[];
  attachments: string[];
  estimatedHours: number;
  actualHours: number;
  progress: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  teamId?: string;
}

// ─── List Response ────────────────────────────────────────────────────────────

export class TaskListResponseDto {
  data: TaskResponseDto[];
  total: number;
  page: number;
  limit: number;
}

// ─── Pagination Query ─────────────────────────────────────────────────────────

export class PaginationDto {
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  limit?: number = 20;
}

// ─── Combined Filter + Pagination ─────────────────────────────────────────────

export class TaskQueryDto extends TaskFilterDto {
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  limit?: number = 20;
}

// ─── Specific Operation DTOs ──────────────────────────────────────────────────

export class CompleteTaskDto {
  @IsOptional()
  @IsNumber()
  actualHours?: number;
}

export class UpdateProgressDto {
  @IsNumber()
  progress: number;
}

export class AddChecklistDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  items: ChecklistItemDto[];
}

export class UpdateChecklistItemDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}

export class TaskStatisticsDto {
  byStatus: Array<{ _id: string; count: number }>;
  billable: {
    totalHours: number;
    totalRevenue: number;
  };
}