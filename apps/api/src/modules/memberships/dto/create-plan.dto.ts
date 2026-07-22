import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlanDuration } from '@prisma/client';

export class CreatePlanDto {
  @ApiProperty({ example: 'Basic Monthly' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: PlanDuration, example: PlanDuration.MONTHLY })
  @IsEnum(PlanDuration)
  duration: PlanDuration;

  @ApiProperty({ example: 30 })
  @IsNumber()
  @Min(1)
  durationDays: number;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 'Access to gym equipment' })
  @IsOptional()
  @IsString()
  description?: string;
}
