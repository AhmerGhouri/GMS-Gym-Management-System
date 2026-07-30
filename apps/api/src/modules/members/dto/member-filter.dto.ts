import { IsOptional, IsEnum, IsString } from 'class-validator';
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
}
