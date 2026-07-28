import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { PrismaService } from '../../core/database/prisma.service';
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly prisma: PrismaService) {}
  @Get() list() { return this.prisma.notification.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }); }
  @Patch(':id/read') read(@Param('id') id: string) { return this.prisma.notification.update({ where: { id }, data: { isRead: true } }); }
}
