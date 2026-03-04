import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto, ProjectQueryDto } from './dto/create-project.dto';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // POST /api/projects
  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  create(@Body() dto: CreateProjectDto, @Request() req) {
    return this.projectsService.create(dto, req.user.id || req.user._id);
  }

  // GET /api/projects
  @Get()
  @ApiOperation({ summary: 'List all projects with filters' })
  findAll(@Query() query: ProjectQueryDto) {
    return this.projectsService.findAll(query);
  }

  // GET /api/projects/stats  ← must be before :id
  @Get('stats')
  @ApiOperation({ summary: 'Get project statistics' })
  getStats() {
    return this.projectsService.getStats();
  }

  // GET /api/projects/:id
  @Get(':id')
  @ApiOperation({ summary: 'Get a single project' })
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  // PUT /api/projects/:id
  @Put(':id')
  @ApiOperation({ summary: 'Update a project' })
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  // PATCH /api/projects/:id/progress
  @Patch(':id/progress')
  @ApiOperation({ summary: 'Update project progress (0–100)' })
  updateProgress(
    @Param('id') id: string,
    @Body('progress') progress: number,
  ) {
    return this.projectsService.updateProgress(id, progress);
  }

  // DELETE /api/projects/:id
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project' })
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}