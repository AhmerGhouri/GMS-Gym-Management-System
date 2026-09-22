import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { PaymentStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { ZkUserService } from '../device/services/zk-user.service';
import { ExpirationService } from '../cron/expiration.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly zkUser: ZkUserService,
    private readonly expirationService: ExpirationService,
  ) {}

  async getPayments(memberId?: string) {
    return this.prisma.payment.findMany({
      where: memberId ? { memberId } : undefined,
      include: {
        member: true,
        membership: {
          include: { plan: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      ...(memberId ? {} : { take: 500 }),
    });
  }

  async generateAdvanceInvoices(daysAhead: number = 7) {
    return this.expirationService.generateAdvanceInvoices(daysAhead);
  }

  async updatePayment(
    id: string,
    data: {
      paymentStatus?: PaymentStatus;
      paidAmount?: number;
      paymentMethod?: string;
    },
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    const updateData: any = {};

    if (data.paymentStatus) {
      updateData.paymentStatus = data.paymentStatus;
    }

    if (data.paymentMethod) {
      updateData.paymentMethod = data.paymentMethod;
    }

    if (data.paidAmount !== undefined) {
      if (data.paidAmount < 0 || data.paidAmount > Number(payment.remainingDue)) {
        throw new BadRequestException('Payment amount must be between zero and the remaining balance.');
      }
      const paidAmount = Number(payment.paidAmount) + data.paidAmount;
      updateData.paidAmount = paidAmount;
      updateData.remainingDue = Number(payment.totalAmount) - paidAmount;
      updateData.paidAt = new Date();

      // Auto-set status based on paid amount
      if (paidAmount >= Number(payment.totalAmount)) {
        updateData.paymentStatus = 'PAID';
        updateData.remainingDue = 0;
      } else if (paidAmount > 0) {
        updateData.paymentStatus = 'PARTIAL';
      }
    }

    // If explicitly marking as PAID, set paidAmount to totalAmount
    if (data.paymentStatus === 'PAID' && data.paidAmount === undefined) {
      updateData.paidAmount = payment.totalAmount;
      updateData.remainingDue = 0;
      updateData.paidAt = new Date();
    }

    const updatedPayment = await this.prisma.payment.update({
      where: { id },
      data: updateData,
      include: {
        member: true,
      },
    });

    const fullName = `${updatedPayment.member.firstName} ${updatedPayment.member.lastName || ''}`.trim();

    if (updatedPayment.paymentStatus === PaymentStatus.PAID || updatedPayment.paymentStatus === PaymentStatus.PARTIAL) {
      // 1. Activate member status
      await this.prisma.member.update({
        where: { id: updatedPayment.memberId },
        data: { status: 'ACTIVE' },
      });

      // 2. Renew / activate membership (wrapped in try-catch so device registration always runs)
      try {
        const targetMembershipId = updatedPayment.membershipId || (await this.prisma.membership.findFirst({
          where: { memberId: updatedPayment.memberId },
          orderBy: { createdAt: 'desc' },
        }))?.id;

        if (targetMembershipId) {
          const membership = await this.prisma.membership.findUnique({
            where: { id: targetMembershipId },
            include: { plan: true },
          });

          if (membership) {
            const now = new Date();
            const durationDays = membership.plan?.durationDays || 30;

            if (updatedPayment.paymentStatus === PaymentStatus.PAID) {
              // The renewal cycle continues from the membership's previous cycle end date anchored to joining date
              let startDate = membership.endDate ? new Date(membership.endDate) : (updatedPayment.member?.joiningDate ? new Date(updatedPayment.member.joiningDate) : new Date());
              let endDate = new Date(startDate);
              endDate.setDate(endDate.getDate() + durationDays);

              // If member expired multiple cycles ago and endDate is still in the past,
              // advance in cycle steps of durationDays so the anchor day of month is preserved
              while (endDate <= now) {
                startDate = new Date(endDate);
                endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + durationDays);
              }

              await this.prisma.membership.update({
                where: { id: membership.id },
                data: {
                  status: 'ACTIVE',
                  startDate,
                  endDate,
                },
              });
              this.logger.log(`Renewed membership ${membership.id} for member ${updatedPayment.member.memberId}: ${startDate.toISOString()} → ${endDate.toISOString()}`);
            } else {
              // Partial payment: ensure status is ACTIVE and cycle dates are aligned with joining date cycle
              let startDate = membership.endDate ? new Date(membership.endDate) : (updatedPayment.member?.joiningDate ? new Date(updatedPayment.member.joiningDate) : new Date());
              let endDate = new Date(startDate);
              endDate.setDate(endDate.getDate() + durationDays);
              while (endDate <= now) {
                startDate = new Date(endDate);
                endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + durationDays);
              }
              await this.prisma.membership.update({
                where: { id: membership.id },
                data: {
                  status: 'ACTIVE',
                  startDate,
                  endDate,
                },
              });
            }
          }
        }
      } catch (membershipError) {
        this.logger.error(`Failed to update membership for payment ${id}: ${(membershipError as Error).message}`);
        // Continue — device registration must still happen
      }

      // 3. Send notification (non-blocking — errors must not prevent device registration)
      try {
        if (updatedPayment.paymentStatus === PaymentStatus.PAID) {
          await this.notifications.notifyAdmins(
            'Payment received',
            `Invoice ${updatedPayment.invoiceNumber} was marked paid.`,
            'PAYMENT_RECEIVED',
            updatedPayment.memberId,
          );
        }
      } catch (notifyError) {
        this.logger.error(`Failed to send notification for payment ${id}: ${(notifyError as Error).message}`);
      }

      // 4. ALWAYS provision member on all active ZKTeco devices
      try {
        const cleanName = (fullName || updatedPayment.member.firstName || 'Member').trim().substring(0, 24);
        this.logger.log(`Enabling device access for member ${updatedPayment.member.memberId} (${cleanName}) after payment ${updatedPayment.paymentStatus}`);
        await this.zkUser.enqueueEnableOnAllDevices(
          updatedPayment.member.memberId,
          cleanName,
        );
      } catch (deviceError) {
        this.logger.error(`Failed to enqueue device enablement for member ${updatedPayment.member.memberId}: ${(deviceError as Error).message}`);
      }
    } else if (updatedPayment.paymentStatus === PaymentStatus.CANCELLED || updatedPayment.paymentStatus === PaymentStatus.REFUNDED) {
      // Deactivate membership and disable on device
      if (updatedPayment.membershipId) {
        await this.prisma.membership.update({
          where: { id: updatedPayment.membershipId },
          data: { status: 'INACTIVE' },
        });
      }
      
      const hasOtherActive = await this.prisma.membership.findFirst({
        where: {
          memberId: updatedPayment.memberId,
          status: 'ACTIVE',
        },
      });

      if (!hasOtherActive) {
        await this.prisma.member.update({
          where: { id: updatedPayment.memberId },
          data: { status: 'INACTIVE' },
        });
        await this.zkUser.enqueueDisableOnAllDevices(updatedPayment.member.memberId);
      }
    }

    return updatedPayment;
  }
}
