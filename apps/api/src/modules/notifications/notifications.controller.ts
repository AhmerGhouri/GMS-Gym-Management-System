import { Controller, Get, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { PrismaService } from '../../core/database/prisma.service';
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly prisma: PrismaService) {}
  @Get() list() { return this.prisma.notification.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }); }
  @Patch('read-all') readAll() { return this.prisma.notification.updateMany({ where: { isRead: false }, data: { isRead: true } }); }
  @Patch(':id/read') read(@Param('id') id: string) { return this.prisma.notification.update({ where: { id }, data: { isRead: true } }); }
  @Delete(':id') remove(@Param('id') id: string) { return this.prisma.notification.delete({ where: { id } }); }
}
