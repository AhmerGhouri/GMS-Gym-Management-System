import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto, UpdateActivityDto } from './dto';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { Roles } from '../../core/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Activities')
@Controller('activities')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  @Roles(UserRole.RECEPTIONIST, UserRole.GYM_MANAGER)
  @ApiOperation({ summary: 'Get all activities' })
  findAll() {
    return this.activitiesService.findAll();
  }

  @Post()
  @Roles(UserRole.GYM_MANAGER)
  @ApiOperation({ summary: 'Create a new activity' })
  create(@Body() dto: CreateActivityDto) {
    return this.activitiesService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.GYM_MANAGER)
  @ApiOperation({ summary: 'Update an activity' })
  update(@Param('id') id: string, @Body() dto: UpdateActivityDto) {
    return this.activitiesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.GYM_MANAGER)
  @ApiOperation({ summary: 'Delete an activity' })
  remove(@Param('id') id: string) {
    return this.activitiesService.remove(id);
  }
}
