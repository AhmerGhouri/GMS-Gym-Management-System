import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { MembersService } from './members.service';
import { CreateMemberDto, UpdateMemberDto, MemberFilterDto, BulkCreateMemberDto } from './dto';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { Roles } from '../../core/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Members')
@Controller('members')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  @Roles(UserRole.RECEPTIONIST, UserRole.GYM_MANAGER)
  @ApiOperation({ summary: 'Register a new member' })
  create(@Body() createMemberDto: CreateMemberDto) {
    return this.membersService.create(createMemberDto);
  }

  @Post('bulk')
  @Roles(UserRole.RECEPTIONIST, UserRole.GYM_MANAGER)
  @ApiOperation({ summary: 'Register multiple members in bulk' })
  @ApiBody({ type: BulkCreateMemberDto })
  bulkCreate(@Body() bulkCreateMemberDto: BulkCreateMemberDto) {
    return this.membersService.bulkCreate(bulkCreateMemberDto.members);
  }

  @Get()
  @Roles(UserRole.RECEPTIONIST, UserRole.GYM_MANAGER)
  @ApiOperation({ summary: 'Get all members with pagination and filters' })
  findAll(@Query() filterDto: MemberFilterDto) {
    return this.membersService.findAll(filterDto);
  }

  @Get(':id')
  @Roles(UserRole.RECEPTIONIST, UserRole.GYM_MANAGER)
  @ApiOperation({ summary: 'Get member details by ID' })
  findOne(@Param('id') id: string) {
    return this.membersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.RECEPTIONIST, UserRole.GYM_MANAGER)
  @ApiOperation({ summary: 'Update a member' })
  update(@Param('id') id: string, @Body() updateMemberDto: UpdateMemberDto) {
    return this.membersService.update(id, updateMemberDto);
  }

  @Delete(':id')
  @Roles(UserRole.GYM_MANAGER)
  @ApiOperation({ summary: 'Delete (soft) a member' })
  remove(@Param('id') id: string) {
    return this.membersService.remove(id);
  }
}
