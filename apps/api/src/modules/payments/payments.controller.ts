import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all payments' })
  getPayments() {
    return this.paymentsService.getPayments();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update payment status' })
  updatePayment(
    @Param('id') id: string,
    @Body() body: { paymentStatus?: string; paidAmount?: number; paymentMethod?: string },
  ) {
    return this.paymentsService.updatePayment(id, body as any);
  }
}
