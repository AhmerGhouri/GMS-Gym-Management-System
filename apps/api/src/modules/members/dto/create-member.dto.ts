import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsEnum,
  IsDateString,
  MaxLength,
  MinLength,
  Matches,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '@prisma/client';

export class CreateMemberDto {
  @ApiProperty({ example: 'Ahmed' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Khan' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ example: 'Muhammad Khan' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fatherName?: string;

  @ApiPropertyOptional({ example: '1995-06-15' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({ enum: Gender, example: Gender.MALE })
  @IsEnum(Gender)
  gender: Gender;

  @ApiPropertyOptional({ example: '2023-01-01' })
  @IsOptional()
  @IsDateString()
  joiningDate?: string;

  @ApiPropertyOptional({ example: 'plan_id_123' })
  @IsOptional()
  @IsString()
  planId?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  includeAdmissionFee?: boolean;

  @ApiProperty({ example: '03001234567' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(15)
  phone: string;

  @ApiPropertyOptional({ example: 'ahmed@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '3520112345671' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{13}$/, { message: 'CNIC must be 13 digits' })
  cnic?: string;

  @ApiPropertyOptional({ example: 'House 123, Street 5, Lahore' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ example: '03009876543' })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  emergencyContact?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
