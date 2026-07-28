import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/database/prisma.service';
import * as nodemailer from 'nodemailer';
import { UserRole } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  async notifyAdmins(title: string, message: string, type: string, memberId?: string) {
    await this.prisma.notification.create({ data: { title, message, type, memberId } });
    const host = this.config.get<string>('SMTP_HOST');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASSWORD');
    if (!host || !user || !pass) return;
    const admins = await this.prisma.user.findMany({ where: { role: UserRole.SUPER_ADMIN, isActive: true }, select: { email: true } });
    if (!admins.length) return;
    try {
      const transport = nodemailer.createTransport({ host, port: Number(this.config.get('SMTP_PORT', '587')), secure: this.config.get('SMTP_SECURE') === 'true', auth: { user, pass } });
      await transport.sendMail({ from: this.config.get('SMTP_FROM_EMAIL', user), to: admins.map((admin) => admin.email).join(','), subject: `[GMS] ${title}`, text: message, html: this.emailTemplate(title, message, type) });
    } catch (error) { this.logger.error(`Email notification failed: ${(error as Error).message}`); }
  }

  private emailTemplate(title: string, message: string, type: string) {
    const color = type === 'MEMBERSHIP_EXPIRY' ? '#ef4444' : type === 'PAYMENT_RECEIVED' ? '#10b981' : '#0891b2';
    return `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a"><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden"><tr><td style="background:#0f172a;padding:24px;color:#fff;font-size:22px;font-weight:700">Gym Management System</td></tr><tr><td style="padding:32px"><div style="display:inline-block;background:${color};color:#fff;border-radius:999px;padding:6px 12px;font-size:12px;font-weight:700">NOTIFICATION</div><h1 style="font-size:24px;margin:20px 0 12px">${title}</h1><p style="font-size:16px;line-height:1.6;color:#475569">${message}</p><hr style="border:0;border-top:1px solid #e2e8f0;margin:28px 0"><p style="font-size:12px;color:#94a3b8">This is an automated Gym Management System notification.</p></td></tr></table></td></tr></table></body></html>`;
  }
}
