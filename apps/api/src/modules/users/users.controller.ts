import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { Roles } from '../../core/auth/decorators/roles.decorator';
import { Permissions } from '../../core/auth/decorators/permissions.decorator';
import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class UsersController {
  constructor(private readonly users: UsersService) {}
  
  @Get() 
  @Permissions('users.view')
  list() { return this.users.list(); }
  
  @Get(':id') 
  @Permissions('users.view')
  get(@Param('id') id: string) { return this.users.get(id); }
  
  @Post() 
  @Permissions('users.manage')
  create(@Body() body: any) { return this.users.create(body); }
  
  @Patch(':id') 
  @Permissions('users.manage')
  update(@Param('id') id: string, @Body() body: any) { return this.users.update(id, body); }
  
  @Delete(':id') 
  @Permissions('users.manage')
  remove(@Param('id') id: string) { return this.users.remove(id); }

  @Post('bulk-delete')
  @Permissions('users.manage')
  bulkRemove(@Body() body: { ids: string[] }) { return this.users.bulkRemove(body.ids); }
}
