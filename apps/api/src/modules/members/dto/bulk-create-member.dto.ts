import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateMemberDto } from './create-member.dto';

export class BulkCreateMemberDto {
  @ApiProperty({ type: [CreateMemberDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMemberDto)
  members: CreateMemberDto[];
}
