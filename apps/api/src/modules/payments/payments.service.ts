import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { PaymentStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { ZkUserService } from '../device/services/zk-user.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly zkUser: ZkUserService,
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
      if (data.paidAmount < 0 || data.paidAmount > Number(payment.remainingDue)) {
        throw new BadRequestException('Payment amount must be between zero and the remaining balance.');
      }
      const paidAmount = Number(payment.paidAmount) + data.paidAmount;
      updateData.paidAmount = paidAmount;
      updateData.remainingDue = Number(payment.totalAmount) - paidAmount;

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
    }

    const updatedPayment = await this.prisma.payment.update({
      where: { id },
      data: updateData,
      include: {
        member: true,
      },
    });

    if (updatedPayment.paymentStatus === PaymentStatus.PAID || updatedPayment.paymentStatus === PaymentStatus.PARTIAL) {
      // Membership access stays active; the invoice carries the outstanding-balance state.
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

      if (updatedPayment.paymentStatus === PaymentStatus.PAID) await this.notifications.notifyAdmins(
        'Payment received',
        `Invoice ${updatedPayment.invoiceNumber} was marked paid.`,
        'PAYMENT_RECEIVED',
        updatedPayment.memberId,
      );

      // Provision member on all active ZKTeco devices using the new ZkUserService
      await this.zkUser.enqueueEnableOnAllDevices(
        updatedPayment.member.memberId,
        `${updatedPayment.member.firstName} ${updatedPayment.member.lastName}`
      );
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
