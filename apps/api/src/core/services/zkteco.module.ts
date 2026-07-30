import { Module, Global } from '@nestjs/common';
import { ZktecoService } from './zkteco.service';
import { DatabaseModule } from '../database/database.module';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [ZktecoService],
  exports: [ZktecoService],
})
export class ZktecoModule {}
