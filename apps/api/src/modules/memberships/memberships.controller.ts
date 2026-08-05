import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { CreatePlanDto, UpdatePlanDto, UpdateMembershipDto } from './dto';

@ApiTags('Memberships')
@Controller('memberships')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Get all membership plans' })
  getPlans() {
    return this.membershipsService.getPlans();
  }

  @Post('plans')
  @ApiOperation({ summary: 'Create a membership plan' })
  createPlan(@Body() dto: CreatePlanDto) {
    return this.membershipsService.createPlan(dto);
  }

  @Patch('plans/:id')
  @ApiOperation({ summary: 'Update a membership plan' })
  updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.membershipsService.updatePlan(id, dto);
  }

  @Delete('plans/:id')
  @ApiOperation({ summary: 'Delete a membership plan' })
  deletePlan(@Param('id') id: string) {
    return this.membershipsService.deletePlan(id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all memberships' })
  getMemberships() {
    return this.membershipsService.getMemberships();
  }

  @Post()
  @ApiOperation({ summary: 'Assign a plan to a member' })
  assignPlan(@Body() body: { memberId: string; planId: string; startDate?: string; includeAdmissionFee?: boolean; activityIds?: string[]; manualAdmissionFee?: number }) {
    return this.membershipsService.assignPlan(
      body.memberId,
      body.planId,
      body.startDate ? new Date(body.startDate) : undefined,
      body.includeAdmissionFee,
      body.activityIds,
      body.manualAdmissionFee,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a membership' })
  updateMembership(@Param('id') id: string, @Body() dto: UpdateMembershipDto) {
    return this.membershipsService.updateMembership(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a membership' })
  deleteMembership(@Param('id') id: string) {
    return this.membershipsService.deleteMembership(id);
  }
}
