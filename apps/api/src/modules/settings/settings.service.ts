import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  getAll() { return this.prisma.setting.findMany({ orderBy: { key: 'asc' } }); }

  async save(key: string, value: unknown, group = 'GENERAL') {
    return this.prisma.setting.upsert({
      where: { key }, update: { value: value as any, group }, create: { key, value: value as any, group },
    });
  }

  async getSlots() {
    const setting = await this.prisma.setting.findUnique({ where: { key: 'gym_slots' } });
    return Array.isArray(setting?.value) ? setting.value : [
      { id: 'morning', name: 'Morning', start: '06:00', end: '12:00' },
      { id: 'evening', name: 'Evening', start: '16:00', end: '22:00' },
    ];
  }

  saveSlots(slots: unknown[]) { return this.save('gym_slots', slots, 'GENERAL'); }
}
