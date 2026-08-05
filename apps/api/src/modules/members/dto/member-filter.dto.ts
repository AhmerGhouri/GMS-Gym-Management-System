import { IsOptional, IsEnum, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MemberStatus, Gender } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class MemberFilterDto extends PaginationDto {
  @ApiPropertyOptional({ enum: MemberStatus })
  @IsOptional()
  @IsEnum(MemberStatus)
  status?: MemberStatus;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ example: 'Morning' })
  @IsOptional()
  @IsString()
  timeSlot?: string;

  @ApiPropertyOptional({ example: 'plan-id' })
  @IsOptional()
  @IsString()
  planId?: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  joiningDateFrom?: string;

  @ApiPropertyOptional({ example: '2026-01-31' })
  @IsOptional()
  @IsDateString()
  joiningDateTo?: string;
}
