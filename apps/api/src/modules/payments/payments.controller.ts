import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all payments or filter by member' })
  @ApiQuery({ name: 'memberId', required: false })
  getPayments(@Query('memberId') memberId?: string) {
    return this.paymentsService.getPayments(memberId);
  }

  @Post('generate-advance')
  @ApiOperation({ summary: 'Trigger advance invoice generation for upcoming expirations' })
  @ApiQuery({ name: 'daysAhead', required: false, type: Number })
  generateAdvance(@Query('daysAhead') daysAhead?: number) {
    return this.paymentsService.generateAdvanceInvoices(daysAhead ? Number(daysAhead) : 7);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update payment status' })
  updatePayment(
    @Param('id') id: string,
    @Body() body: { paymentStatus?: string; paidAmount?: number; paymentMethod?: string },
  ) {
    return this.paymentsService.updatePayment(id, body as any);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a payment invoice' })
  deletePayment(@Param('id') id: string) {
    return this.paymentsService.deletePayment(id);
  }
}
