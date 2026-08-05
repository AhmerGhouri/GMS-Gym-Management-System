import { IsInt, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateDeviceUserDto {
    @IsInt()
    userId: number; // gym‑member identifier to be used on device

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    password?: string;
}