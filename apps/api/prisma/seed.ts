import { PrismaClient, UserRole, PlanDuration } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ============================================
  // Seed Default Super Admin
  // ============================================
  const hashedPassword = await bcrypt.hash('Admin@123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@gms.local' },
    update: {},
    create: {
      email: 'admin@gms.local',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  });
  console.log(`✅ Admin user created: ${admin.email}`);

  // ============================================
  // Seed Membership Plans
  // ============================================
  const plans = [
    { name: 'Daily Pass', duration: PlanDuration.DAILY, durationDays: 1, price: 500, description: 'Single day gym access' },
    { name: 'Weekly Plan', duration: PlanDuration.WEEKLY, durationDays: 7, price: 2000, description: '7 days gym access' },
    { name: 'Monthly Plan', duration: PlanDuration.MONTHLY, durationDays: 30, price: 5000, description: '30 days gym access' },
    { name: 'Quarterly Plan', duration: PlanDuration.QUARTERLY, durationDays: 90, price: 13000, description: '3 months gym access' },
    { name: 'Half-Yearly Plan', duration: PlanDuration.HALF_YEARLY, durationDays: 180, price: 24000, description: '6 months gym access' },
    { name: 'Yearly Plan', duration: PlanDuration.YEARLY, durationDays: 365, price: 42000, description: '12 months gym access' },
  ];

  for (const plan of plans) {
    await prisma.membershipPlan.upsert({
      where: { id: plan.name.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: plan,
    });
  }
  console.log(`✅ ${plans.length} membership plans created`);

  // ============================================
  // Seed Default Settings
  // ============================================
  const settings = [
    // Gym Info
    { key: 'gym_name', value: JSON.stringify('IronPulse Gym'), group: 'GYM_INFO', description: 'Gym name' },
    { key: 'gym_address', value: JSON.stringify(''), group: 'GYM_INFO', description: 'Gym address' },
    { key: 'gym_phone', value: JSON.stringify(''), group: 'GYM_INFO', description: 'Gym phone number' },
    { key: 'gym_email', value: JSON.stringify(''), group: 'GYM_INFO', description: 'Gym email address' },
    { key: 'gym_logo', value: JSON.stringify(''), group: 'GYM_INFO', description: 'Gym logo URL' },

    // General
    { key: 'timezone', value: JSON.stringify('Asia/Karachi'), group: 'GENERAL', description: 'System timezone' },
    { key: 'currency', value: JSON.stringify('PKR'), group: 'GENERAL', description: 'Currency code' },
    { key: 'currency_symbol', value: JSON.stringify('Rs.'), group: 'GENERAL', description: 'Currency symbol' },
    { key: 'date_format', value: JSON.stringify('DD/MM/YYYY'), group: 'GENERAL', description: 'Date display format' },
    { key: 'member_id_prefix', value: JSON.stringify('GMS'), group: 'GENERAL', description: 'Member ID prefix' },

    // SMTP
    { key: 'smtp_host', value: JSON.stringify(''), group: 'SMTP', description: 'SMTP server host' },
    { key: 'smtp_port', value: JSON.stringify(587), group: 'SMTP', description: 'SMTP server port' },
    { key: 'smtp_user', value: JSON.stringify(''), group: 'SMTP', description: 'SMTP username' },
    { key: 'smtp_password', value: JSON.stringify(''), group: 'SMTP', description: 'SMTP password' },
    { key: 'smtp_from_name', value: JSON.stringify('GMS'), group: 'SMTP', description: 'Sender name' },
    { key: 'smtp_from_email', value: JSON.stringify(''), group: 'SMTP', description: 'Sender email' },
    { key: 'smtp_secure', value: JSON.stringify(false), group: 'SMTP', description: 'Use TLS/SSL' },

    // Backup
    { key: 'backup_enabled', value: JSON.stringify(true), group: 'BACKUP', description: 'Enable automatic backups' },
    { key: 'backup_schedule', value: JSON.stringify('0 2 * * *'), group: 'BACKUP', description: 'Backup cron schedule (default: 2 AM daily)' },
    { key: 'backup_retention_days', value: JSON.stringify(30), group: 'BACKUP', description: 'Number of days to retain backups' },

    // Theme
    { key: 'default_theme', value: JSON.stringify('dark'), group: 'THEME', description: 'Default UI theme' },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log(`✅ ${settings.length} default settings created`);

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
