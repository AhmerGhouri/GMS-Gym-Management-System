import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.payment.update({
      where: { id },
      data: updateData,
      include: {
        member: true,
      },
    });
  }
}
