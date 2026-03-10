import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TaskService } from './tasks.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskFilterDto,
  TaskResponseDto,
  TaskListResponseDto,
  CompleteTaskDto,
  UpdateProgressDto,
  AddChecklistDto,
  UpdateChecklistItemDto,
  TaskStatisticsDto,
} from './dto/create-task.dto';

@Controller('tasks')
@UseGuards(AuthGuard('jwt'))
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  // ────────────────────────────────────────────────────────────────────────────
  // CREATE
  // ────────────────────────────────────────────────────────────────────────────
  @Post()
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @Req() req: any,
  ): Promise<TaskResponseDto> {
    return this.taskService.create(createTaskDto, req.user.id) as unknown as TaskResponseDto;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // SPECIFIC ROUTES (Must come BEFORE generic :id)
  // ────────────────────────────────────────────────────────────────────────────

  @Get('stats/overview')
  async getStatistics(@Req() req: any): Promise<TaskStatisticsDto> {
    return this.taskService.getTaskStatistics(req.user.id);
  }

  @Get('project/:projectId')
  async getTasksByProject(
    @Param('projectId') projectId: string,
  ): Promise<TaskResponseDto[]> {
    return this.taskService.getTasksByProject(projectId) as unknown as TaskResponseDto[];
  }

  @Get('customer/:customerId')
  async getTasksByCustomer(
    @Param('customerId') customerId: string,
  ): Promise<TaskResponseDto[]> {
    return this.taskService.getTasksByCustomer(customerId) as unknown as TaskResponseDto[];
  }

  // ────────────────────────────────────────────────────────────────────────────
  // LIST
  // ────────────────────────────────────────────────────────────────────────────

  @Get()
  async findAll(
    @Req() req: any,
    @Query() filterDto?: TaskFilterDto,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<TaskListResponseDto> {
    return this.taskService.findAll(
      req.user.id,
      filterDto,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    ) as unknown as TaskListResponseDto;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RETRIEVE BY ID
  // ────────────────────────────────────────────────────────────────────────────

  @Get(':id')
  async findById(@Param('id') id: string): Promise<TaskResponseDto> {
    return this.taskService.findById(id) as unknown as TaskResponseDto;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // UPDATE
  // ────────────────────────────────────────────────────────────────────────────

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Req() req: any,
  ): Promise<TaskResponseDto> {
    return this.taskService.update(id, updateTaskDto, req.user.id) as unknown as TaskResponseDto;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // DELETE
  // ────────────────────────────────────────────────────────────────────────────

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<{ message: string }> {
    await this.taskService.delete(id, req.user.id);
    return { message: 'Task deleted successfully' };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // TASK OPERATIONS
  // ────────────────────────────────────────────────────────────────────────────

  @Post(':id/complete')
  async complete(
    @Param('id') id: string,
    @Body() body: CompleteTaskDto,
    @Req() req: any,
  ): Promise<TaskResponseDto> {
    return this.taskService.completeTask(id, req.user.id, body.actualHours) as unknown as TaskResponseDto;
  }

  @Patch(':id/progress')
  async updateProgress(
    @Param('id') id: string,
    @Body() body: UpdateProgressDto,
  ): Promise<TaskResponseDto> {
    if (
      typeof body.progress !== 'number' ||
      body.progress < 0 ||
      body.progress > 100
    ) {
      throw new BadRequestException(
        'Progress must be a number between 0 and 100',
      );
    }
    return this.taskService.updateProgress(id, body.progress) as unknown as TaskResponseDto;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // CHECKLIST OPERATIONS
  // ────────────────────────────────────────────────────────────────────────────

  @Post(':id/checklist')
  async addChecklist(
    @Param('id') id: string,
    @Body() body: AddChecklistDto,
  ): Promise<TaskResponseDto> {
    return this.taskService.addChecklist(id, body.items) as unknown as TaskResponseDto;
  }

  @Patch(':id/checklist/:itemId')
  async updateChecklistItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() body: UpdateChecklistItemDto,
  ): Promise<TaskResponseDto> {
    return this.taskService.updateChecklistItem(
      id,
      itemId,
      body.text,
      body.completed,
    ) as unknown as TaskResponseDto;
  }

  @Delete(':id/checklist/:itemId')
  async removeChecklistItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ): Promise<TaskResponseDto> {
    return this.taskService.removeChecklistItem(id, itemId) as unknown as TaskResponseDto;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // FOLLOWERS OPERATIONS
  // ────────────────────────────────────────────────────────────────────────────

  @Post(':id/followers')
  async addFollower(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<TaskResponseDto> {
    return this.taskService.addFollower(id, req.user.id) as unknown as TaskResponseDto;
  }

  @Delete(':id/followers')
  async removeFollower(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<TaskResponseDto> {
    return this.taskService.removeFollower(id, req.user.id) as unknown as TaskResponseDto;
  }
}