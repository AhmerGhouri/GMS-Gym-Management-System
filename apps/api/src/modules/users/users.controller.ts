import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { Roles } from '../../core/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class UsersController {
  constructor(private readonly users: UsersService) {}
  @Get() list() { return this.users.list(); }
  @Get(':id') get(@Param('id') id: string) { return this.users.get(id); }
  @Post() create(@Body() body: any) { return this.users.create(body); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: any) { return this.users.update(id, body); }
  @Delete(':id') remove(@Param('id') id: string) { return this.users.remove(id); }
}
