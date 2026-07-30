import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { Roles } from '../../core/auth/decorators/roles.decorator';
import { PrismaService } from '../../core/database/prisma.service';
import { UserRole } from '@prisma/client';
@Controller('roles') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.SUPER_ADMIN)
export class RolesController {
 constructor(private readonly prisma: PrismaService) {}
 @Get() list() { return this.prisma.customRole.findMany({ orderBy: { name: 'asc' } }); }
 @Post() create(@Body() body: { name: string; permissions: string[] }) { return this.prisma.customRole.create({ data: { name: body.name, permissions: body.permissions } }); }
 @Patch(':id') update(@Param('id') id: string, @Body() body: { name?: string; permissions?: string[] }) { return this.prisma.customRole.update({ where: { id }, data: body as any }); }
 @Delete(':id') remove(@Param('id') id: string) { return this.prisma.customRole.delete({ where: { id } }); }
}
