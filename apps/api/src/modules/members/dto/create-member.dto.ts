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
  IsArray,
  IsNumber,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, MemberStatus } from '@prisma/client';

export enum AdmissionFeeType {
  NONE = 'NONE',
  FULL = 'FULL',
  MANUAL = 'MANUAL',
}

export class CreateMemberDto {
  @ApiProperty({ example: 'Ahmed' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiPropertyOptional({ example: 'Khan' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

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


  @ApiPropertyOptional({ enum: AdmissionFeeType, example: AdmissionFeeType.NONE })
  @IsOptional()
  @IsEnum(AdmissionFeeType)
  admissionFeeType?: AdmissionFeeType;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @Transform(({ value }) => value === '' || value === undefined ? undefined : Number(value))
  @IsNumber()
  @Min(0)
  manualAdmissionFee?: number;

  @ApiPropertyOptional({ example: 'Morning' })
  @IsOptional()
  @IsString()
  timeSlot?: string;

  @ApiPropertyOptional({ example: ['uuid-1', 'uuid-2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  activityIds?: string[];

  @ApiPropertyOptional({ example: '03001234567' })
  @IsOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsString()
  @MinLength(10)
  @MaxLength(15)
  phone?: string;

  @ApiPropertyOptional({ example: 'ahmed@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '3520112345671' })
  @IsOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
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

  @ApiPropertyOptional({ enum: MemberStatus, example: MemberStatus.ACTIVE })
  @IsOptional()
  @IsEnum(MemberStatus)
  status?: MemberStatus;
}
