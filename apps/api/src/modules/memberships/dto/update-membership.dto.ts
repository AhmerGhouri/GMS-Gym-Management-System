import { IsOptional, IsEnum, IsString, IsDateString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MembershipStatus } from '@prisma/client';

export class UpdateMembershipDto {
  @ApiPropertyOptional({ enum: MembershipStatus })
  @IsOptional()
  @IsEnum(MembershipStatus)
  status?: MembershipStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  frozenAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  frozenUntil?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  frozenDaysUsed?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
