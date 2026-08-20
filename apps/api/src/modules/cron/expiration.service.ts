import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../core/database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ZkUserService } from '../device/services/zk-user.service';

@Injectable()
export class ExpirationService {
  private readonly logger = new Logger(ExpirationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly zkUser: ZkUserService,
  ) { }

  // Run at midnight every day
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleMembershipExpiration() {
    this.logger.log('Running daily membership expiration job...');
    const now = new Date();

    // Find all ACTIVE memberships where endDate is in the past
    const expiredMemberships = await this.prisma.membership.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { lt: now },
      },
      include: {
        plan: true,
        member: { select: { id: true, memberId: true, firstName: true, lastName: true } },
      },
    });

    if (expiredMemberships.length === 0) {
      this.logger.log('No memberships to expire today.');
    } else {
      this.logger.log(`Found ${expiredMemberships.length} memberships to expire.`);

      for (const membership of expiredMemberships) {
        try {
          await this.prisma.$transaction(async (prisma) => {
            // 1. Update membership status
            await prisma.membership.update({
              where: { id: membership.id },
              data: { status: 'EXPIRED' },
            });

            // 2. Create a PENDING payment for the next billing cycle if not already created
            const existingPending = await prisma.payment.findFirst({
              where: {
                membershipId: membership.id,
                paymentStatus: 'PENDING',
              },
            });

            if (!existingPending) {
              const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
              const planPrice = membership.planPrice;

              await prisma.payment.create({
                data: {
                  invoiceNumber,
                  memberId: membership.memberId,
                  membershipId: membership.id,
                  amount: planPrice,
                  discount: 0,
                  totalAmount: planPrice,
                  paidAmount: 0,
                  remainingDue: planPrice,
                  paymentMethod: 'CASH',
                  paymentStatus: 'PENDING',
                  paidAt: new Date(),
                },
              });
            }

            // 3. Update member status if they have no other active memberships
            const otherActive = await prisma.membership.findFirst({
              where: {
                memberId: membership.memberId,
                status: 'ACTIVE',
                id: { not: membership.id },
              },
            });

            if (!otherActive) {
              await prisma.member.update({
                where: { id: membership.memberId },
                data: { status: 'INACTIVE' },
              });
            }
          });

          // 4. Enqueue DISABLE_USER on all devices via DeviceModule
          const hasOtherActive = await this.prisma.membership.findFirst({
            where: {
              memberId: membership.memberId,
              status: 'ACTIVE',
              id: { not: membership.id },
            },
          });

          if (!hasOtherActive) {
            await this.zkUser.enqueueDisableOnAllDevices(membership.member.memberId);
            this.logger.log(`Enqueued DISABLE_USER for member ${membership.member.memberId}`);
          }

          this.logger.log(`Successfully expired membership ${membership.id} for member ${membership.memberId}`);
          await this.notifications.notifyAdmins(
            'Membership expired',
            `A membership expired and an unpaid renewal voucher was created.`,
            'MEMBERSHIP_EXPIRY',
            membership.memberId,
          );
        } catch (error) {
          this.logger.error(`Failed to expire membership ${membership.id}: ${(error as Error).message}`);
        }
      }
    }
  }

  // Run at 1 AM every day to generate upcoming invoices 7 days before expiration
  @Cron(CronExpression.EVERY_MINUTE)
  async handleUpcomingExpirations() {
    this.logger.log('Running daily upcoming expiration job (7 days before)...');

    const now = new Date();
    const targetDateEnd = new Date();
    targetDateEnd.setDate(targetDateEnd.getDate() + 7);
    targetDateEnd.setHours(23, 59, 59, 999);

    const upcomingMemberships = await this.prisma.membership.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          gt: now,
          lte: targetDateEnd,
        },
      },
      include: { plan: true },
    });

    if (upcomingMemberships.length === 0) {
      this.logger.log('No upcoming memberships expiring in 7 days.');
      return;
    }

    this.logger.log(`Found ${upcomingMemberships.length} memberships expiring in 7 days.`);

    for (const membership of upcomingMemberships) {
      try {
        // Check if we already created a pending payment recently
        const existingPending = await this.prisma.payment.findFirst({
          where: {
            membershipId: membership.id,
            paymentStatus: 'PENDING',
          },
        });


        if (!existingPending) {
          const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
          const planPrice = membership.planPrice;

          await this.prisma.payment.create({
            data: {
              invoiceNumber,
              memberId: membership.memberId,
              membershipId: membership.id,
              amount: planPrice,
              discount: 0,
              totalAmount: planPrice,
              paidAmount: 0,
              remainingDue: planPrice,
              paymentMethod: 'CASH',
              paymentStatus: 'PENDING',
              paidAt: now,
            },
          });

          this.logger.log(`Generated upcoming PENDING invoice for membership ${membership.id}`);
        }
      } catch (error) {
        this.logger.error(`Failed to generate upcoming invoice for membership ${membership.id}: ${(error as Error).message}`);
      }
    }
  }

}
