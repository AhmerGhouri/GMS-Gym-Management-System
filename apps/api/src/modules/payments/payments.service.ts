import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { PaymentStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { ZktecoService } from '../../core/services/zkteco.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly zkteco: ZktecoService,
  ) {}

  async getPayments() {
    return this.prisma.payment.findMany({
      include: {
        member: true,
        membership: {
          include: { plan: true },
        },
      },
      orderBy: { paidAt: 'desc' },
      take: 100,
    });
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
      updateData.paidAmount = data.paidAmount;
      updateData.remainingDue = Number(payment.totalAmount) - data.paidAmount;

      // Auto-set status based on paid amount
      if (data.paidAmount >= Number(payment.totalAmount)) {
        updateData.paymentStatus = 'PAID';
        updateData.remainingDue = 0;
      } else if (data.paidAmount > 0) {
        updateData.paymentStatus = 'PARTIAL';
      }
    }

    // If explicitly marking as PAID, set paidAmount to totalAmount
    if (data.paymentStatus === 'PAID' && data.paidAmount === undefined) {
      updateData.paidAmount = payment.totalAmount;
      updateData.remainingDue = 0;
    }

    const updatedPayment = await this.prisma.payment.update({
      where: { id },
      data: updateData,
      include: {
        member: true,
      },
    });

    if (updatedPayment.paymentStatus === PaymentStatus.PAID) {
      // Activate the member and membership
      await this.prisma.member.update({
        where: { id: updatedPayment.memberId },
        data: { status: 'ACTIVE' },
      });
      if (updatedPayment.membershipId) {
        await this.prisma.membership.update({
          where: { id: updatedPayment.membershipId },
          data: { status: 'ACTIVE' },
        });
      }

      await this.notifications.notifyAdmins(
        'Payment received',
        `Invoice ${updatedPayment.invoiceNumber} was marked paid.`,
        'PAYMENT_RECEIVED',
        updatedPayment.memberId,
      );

      // Provision member on all active ZKTeco devices
      await this.provisionMemberOnDevices(updatedPayment.member);
    }

    return updatedPayment;
  }

  /**
   * Enqueue SyncJobs to add this member to every active device.
   * The AttendanceSyncService processes these jobs every minute.
   */
  private async provisionMemberOnDevices(member: any) {
    const devices = await this.prisma.device.findMany({ where: { isActive: true } });
    for (const device of devices) {
      // Avoid duplicate jobs
      const existing = await this.prisma.syncJob.findFirst({
        where: {
          deviceId: device.id,
          memberId: member.id,
          action: 'ENABLE_USER',
          status: 'PENDING',
        },
      });
      if (!existing) {
        await this.prisma.syncJob.create({
          data: {
            deviceId: device.id,
            memberId: member.id,
            action: 'ENABLE_USER',
          },
        });
      }
    }
  }
}
