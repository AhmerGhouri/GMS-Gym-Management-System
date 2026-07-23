import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class ExpirationService {
  private readonly logger = new Logger(ExpirationService.name);

  constructor(private readonly prisma: PrismaService) {}

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

            // 2. Create a PENDING payment for the next billing cycle
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

              // Create SyncJob to remove access from all gate machines
              const devices = await prisma.device.findMany({ where: { isActive: true } });
              for (const device of devices) {
                await prisma.syncJob.create({
                  data: {
                    deviceId: device.id,
                    memberId: membership.memberId,
                    action: 'DISABLE_USER',
                  }
                });
              }
            }
          });
          this.logger.log(`Successfully expired membership ${membership.id} for member ${membership.memberId}`);
        } catch (error) {
          this.logger.error(`Failed to expire membership ${membership.id}: ${(error as Error).message}`);
        }
      }
    }

    // Also generate PENDING payments for members with recurring unpaid months
    // Find expired memberships that have no PENDING payment for the current month
    await this.generateMonthlyPendingPayments(now);
  }

  /**
   * For expired memberships, keep generating monthly PENDING payment records
   * until admin marks the previous one as PAID.
   * This runs as part of the daily cron — it checks if we're on the 1st of the month
   * or if there's no PENDING payment for the current month yet.
   */
  private async generateMonthlyPendingPayments(now: Date) {
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Find all EXPIRED memberships
    const expiredMemberships = await this.prisma.membership.findMany({
      where: {
        status: 'EXPIRED',
      },
      include: {
        plan: true,
      },
    });

    for (const membership of expiredMemberships) {
      try {
        // Check if a payment already exists for this month for this membership
        const existingMonthlyPayment = await this.prisma.payment.findFirst({
          where: {
            membershipId: membership.id,
            paymentStatus: 'PENDING',
            paidAt: {
              gte: currentMonthStart,
              lt: nextMonthStart,
            },
          },
        });

        if (!existingMonthlyPayment) {
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

          this.logger.log(`Generated monthly PENDING payment for expired membership ${membership.id}`);
        }
      } catch (error) {
        this.logger.error(`Failed to generate monthly payment for membership ${membership.id}: ${(error as Error).message}`);
      }
    }
  }
}
