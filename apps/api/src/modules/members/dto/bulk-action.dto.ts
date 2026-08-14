import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsString } from 'class-validator';

export class BulkActionDto {
  @ApiProperty({ type: [String], description: 'Array of member IDs' })
  @IsArray()
  @IsString({ each: true })
  memberIds: string[];

  @ApiProperty({
    enum: ['DELETE', 'ACTIVE', 'INACTIVE', 'FROZEN'],
    description: 'Action to perform on selected members',
  })
  @IsEnum(['DELETE', 'ACTIVE', 'INACTIVE', 'FROZEN'])
  action: 'DELETE' | 'ACTIVE' | 'INACTIVE' | 'FROZEN';
}
