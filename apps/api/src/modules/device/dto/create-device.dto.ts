import { IsString, IsInt, IsIP, IsEnum, IsBoolean } from 'class-validator';
import { DeviceConnectionType } from '@prisma/client';

export class CreateDeviceDto {
    @IsString()
    name: string;

    @IsIP()
    ipAddress: string;

    @IsInt()
    port: number;

    @IsEnum(DeviceConnectionType)
    connectionType: DeviceConnectionType;

    @IsBoolean()
    isActive: boolean;
}