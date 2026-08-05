import { PartialType } from '@nestjs/mapped-types';
import { CreateDeviceUserDto } from './create-device-user.dto';

export class UpdateDeviceUserDto extends PartialType(CreateDeviceUserDto) { }