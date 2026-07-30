import {
  DashboardStats,
  RevenueChartData,
  AttendanceChartData,
  MembershipDistribution,
  Member,
  MembershipPlan,
  Membership,
  AttendanceLog,
  Payment,
  Device,
  GateAccessLog,
  MemberStatus,
  Gender,
  MembershipStatus,
  PlanDuration,
  PaymentMethod,
  PaymentStatus,
  DeviceConnectionType,
  DeviceStatus,
  AccessResult,
  AccessDenyReason,
} from '@gms/types';

// ============================================
// Dashboard Mock Data
// ============================================

export const mockDashboardStats: DashboardStats = {
  totalMembers: 342,
  activeMembers: 278,
  expiredMembers: 45,
  todayAttendance: 67,
  todayRevenue: 45000,
  monthlyRevenue: 890000,
  outstandingDues: 125000,
};

export const mockRevenueData: RevenueChartData[] = [
  { month: 'Jan', revenue: 650000 },
  { month: 'Feb', revenue: 720000 },
  { month: 'Mar', revenue: 680000 },
  { month: 'Apr', revenue: 810000 },
  { month: 'May', revenue: 760000 },
  { month: 'Jun', revenue: 890000 },
  { month: 'Jul', revenue: 820000 },
  { month: 'Aug', revenue: 950000 },
  { month: 'Sep', revenue: 880000 },
  { month: 'Oct', revenue: 920000 },
  { month: 'Nov', revenue: 870000 },
  { month: 'Dec', revenue: 1020000 },
];

export const mockAttendanceData: AttendanceChartData[] = [
  { date: 'Mon', count: 58 },
  { date: 'Tue', count: 72 },
  { date: 'Wed', count: 65 },
  { date: 'Thu', count: 80 },
  { date: 'Fri', count: 55 },
  { date: 'Sat', count: 92 },
  { date: 'Sun', count: 43 },
];

export const mockMembershipDistribution: MembershipDistribution[] = [
  { plan: 'Monthly', count: 120, percentage: 43 },
  { plan: 'Quarterly', count: 68, percentage: 24 },
  { plan: 'Half-Yearly', count: 52, percentage: 19 },
  { plan: 'Yearly', count: 38, percentage: 14 },
];

// ============================================
// Member Mock Data
// ============================================

export const mockMembers: Member[] = [
  {
    id: '1',
    memberId: 'GMS-0001',
    firstName: 'Ahmed',
    lastName: 'Khan',
    fatherName: 'Imran Khan',
    gender: Gender.MALE,
    dateOfBirth: '1995-03-15',
    phone: '03001234567',
    email: 'ahmed.khan@email.com',
    cnic: '3520112345671',
    address: 'House 123, Block B, DHA Phase 5, Lahore',
    emergencyContact: '03009876543',
    photoUrl: null,
    status: MemberStatus.ACTIVE,
    joiningDate: '2024-01-15',
    notes: 'Regular morning member',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-06-15T10:00:00Z',
    activeMembership: null,
  },
  {
    id: '2',
    memberId: 'GMS-0002',
    firstName: 'Sara',
    lastName: 'Ali',
    fatherName: 'Ali Ahmad',
    gender: Gender.FEMALE,
    dateOfBirth: '1998-07-22',
    phone: '03112345678',
    email: 'sara.ali@email.com',
    cnic: '3520298765432',
    address: 'Flat 4A, Al-Noor Apartments, Gulberg III, Lahore',
    emergencyContact: '03115556667',
    photoUrl: null,
    status: MemberStatus.ACTIVE,
    joiningDate: '2024-02-01',
    notes: null,
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-07-01T10:00:00Z',
    activeMembership: null,
  },
  {
    id: '3',
    memberId: 'GMS-0003',
    firstName: 'Bilal',
    lastName: 'Hussain',
    fatherName: 'Hussain Shah',
    gender: Gender.MALE,
    dateOfBirth: '1990-11-08',
    phone: '03221234567',
    email: null,
    cnic: '3520311111111',
    address: 'Street 5, Township, Lahore',
    emergencyContact: '03229876543',
    photoUrl: null,
    status: MemberStatus.INACTIVE,
    joiningDate: '2023-06-10',
    notes: 'Membership expired, needs follow-up',
    createdAt: '2023-06-10T10:00:00Z',
    updatedAt: '2024-03-10T10:00:00Z',
    activeMembership: null,
  },
  {
    id: '4',
    memberId: 'GMS-0004',
    firstName: 'Fatima',
    lastName: 'Zahra',
    fatherName: 'Zahra Malik',
    gender: Gender.FEMALE,
    dateOfBirth: '2000-01-30',
    phone: '03331234567',
    email: 'fatima.z@email.com',
    cnic: null,
    address: 'House 56, Johar Town, Lahore',
    emergencyContact: null,
    photoUrl: null,
    status: MemberStatus.ACTIVE,
    joiningDate: '2024-04-20',
    notes: null,
    createdAt: '2024-04-20T10:00:00Z',
    updatedAt: '2024-04-20T10:00:00Z',
    activeMembership: null,
  },
  {
    id: '5',
    memberId: 'GMS-0005',
    firstName: 'Usman',
    lastName: 'Tariq',
    fatherName: 'Tariq Mehmood',
    gender: Gender.MALE,
    dateOfBirth: '1988-05-12',
    phone: '03451234567',
    email: 'usman.tariq@email.com',
    cnic: '3520555555555',
    address: 'Block C, Model Town, Lahore',
    emergencyContact: '03459999888',
    photoUrl: null,
    status: MemberStatus.SUSPENDED,
    joiningDate: '2023-09-01',
    notes: 'Payment overdue for 2 months',
    createdAt: '2023-09-01T10:00:00Z',
    updatedAt: '2024-05-15T10:00:00Z',
    activeMembership: null,
  },
  {
    id: '6',
    memberId: 'GMS-0006',
    firstName: 'Hassan',
    lastName: 'Raza',
    fatherName: 'Raza Ali',
    gender: Gender.MALE,
    dateOfBirth: '1993-09-25',
    phone: '03561234567',
    email: 'hassan.r@email.com',
    cnic: '3520666666666',
    address: 'Garden Town, Lahore',
    emergencyContact: '03567778889',
    photoUrl: null,
    status: MemberStatus.ACTIVE,
    joiningDate: '2024-03-05',
    notes: 'Evening batch',
    createdAt: '2024-03-05T10:00:00Z',
    updatedAt: '2024-06-05T10:00:00Z',
    activeMembership: null,
  },
];

// ============================================
// Membership Plan Mock Data
// ============================================

export const mockPlans: MembershipPlan[] = [
  {
    id: 'plan-1',
    name: 'Daily Pass',
    duration: PlanDuration.DAILY,
    durationDays: 1,
    price: 500,
    description: 'Single day access to all facilities',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'plan-2',
    name: 'Monthly Basic',
    duration: PlanDuration.MONTHLY,
    durationDays: 30,
    price: 5000,
    description: 'Full gym access for 30 days. No personal trainer.',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'plan-3',
    name: 'Monthly Premium',
    duration: PlanDuration.MONTHLY,
    durationDays: 30,
    price: 8000,
    description: 'Full gym access + personal trainer sessions',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'plan-4',
    name: 'Quarterly',
    duration: PlanDuration.QUARTERLY,
    durationDays: 90,
    price: 13000,
    description: '3-month access with 15% discount',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'plan-5',
    name: 'Half-Yearly',
    duration: PlanDuration.HALF_YEARLY,
    durationDays: 180,
    price: 24000,
    description: '6-month access with 20% discount',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'plan-6',
    name: 'Annual',
    duration: PlanDuration.YEARLY,
    durationDays: 365,
    price: 42000,
    description: 'Full year access with 30% discount + locker included',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// ============================================
// Membership Mock Data
// ============================================

export const mockMemberships: Membership[] = [
  {
    id: 'ms-1',
    memberId: '1',
    planId: 'plan-3',
    startDate: '2024-06-01',
    endDate: '2024-07-01',
    status: MembershipStatus.ACTIVE,
    frozenAt: null,
    frozenUntil: null,
    frozenDaysUsed: 0,
    notes: null,
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2024-06-01T10:00:00Z',
    plan: mockPlans[2],
    member: mockMembers[0],
  },
  {
    id: 'ms-2',
    memberId: '2',
    planId: 'plan-4',
    startDate: '2024-05-01',
    endDate: '2024-08-01',
    status: MembershipStatus.ACTIVE,
    frozenAt: null,
    frozenUntil: null,
    frozenDaysUsed: 0,
    notes: null,
    createdAt: '2024-05-01T10:00:00Z',
    updatedAt: '2024-05-01T10:00:00Z',
    plan: mockPlans[3],
    member: mockMembers[1],
  },
  {
    id: 'ms-3',
    memberId: '3',
    planId: 'plan-2',
    startDate: '2024-02-01',
    endDate: '2024-03-01',
    status: MembershipStatus.EXPIRED,
    frozenAt: null,
    frozenUntil: null,
    frozenDaysUsed: 0,
    notes: null,
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-03-01T10:00:00Z',
    plan: mockPlans[1],
    member: mockMembers[2],
  },
  {
    id: 'ms-4',
    memberId: '4',
    planId: 'plan-6',
    startDate: '2024-04-20',
    endDate: '2025-04-20',
    status: MembershipStatus.ACTIVE,
    frozenAt: null,
    frozenUntil: null,
    frozenDaysUsed: 0,
    notes: null,
    createdAt: '2024-04-20T10:00:00Z',
    updatedAt: '2024-04-20T10:00:00Z',
    plan: mockPlans[5],
    member: mockMembers[3],
  },
  {
    id: 'ms-5',
    memberId: '5',
    planId: 'plan-2',
    startDate: '2024-03-01',
    endDate: '2024-04-01',
    status: MembershipStatus.SUSPENDED,
    frozenAt: null,
    frozenUntil: null,
    frozenDaysUsed: 0,
    notes: 'Payment pending',
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-04-01T10:00:00Z',
    plan: mockPlans[1],
    member: mockMembers[4],
  },
  {
    id: 'ms-6',
    memberId: '6',
    planId: 'plan-5',
    startDate: '2024-03-05',
    endDate: '2024-09-05',
    status: MembershipStatus.ACTIVE,
    frozenAt: null,
    frozenUntil: null,
    frozenDaysUsed: 0,
    notes: null,
    createdAt: '2024-03-05T10:00:00Z',
    updatedAt: '2024-03-05T10:00:00Z',
    plan: mockPlans[4],
    member: mockMembers[5],
  },
];

// ============================================
// Attendance Mock Data
// ============================================

export const mockAttendanceLogs: AttendanceLog[] = [
  { id: 'att-1', memberId: '1', checkIn: '2024-07-15T06:30:00Z', checkOut: '2024-07-15T08:15:00Z', duration: 105, source: 'Device', deviceId: 'dev-1', createdAt: '2024-07-15T06:30:00Z', member: mockMembers[0] },
  { id: 'att-2', memberId: '2', checkIn: '2024-07-15T07:00:00Z', checkOut: '2024-07-15T08:30:00Z', duration: 90, source: 'Device', deviceId: 'dev-1', createdAt: '2024-07-15T07:00:00Z', member: mockMembers[1] },
  { id: 'att-3', memberId: '4', checkIn: '2024-07-15T08:00:00Z', checkOut: '2024-07-15T09:45:00Z', duration: 105, source: 'Manual', deviceId: null, createdAt: '2024-07-15T08:00:00Z', member: mockMembers[3] },
  { id: 'att-4', memberId: '6', checkIn: '2024-07-15T17:00:00Z', checkOut: '2024-07-15T18:30:00Z', duration: 90, source: 'Device', deviceId: 'dev-2', createdAt: '2024-07-15T17:00:00Z', member: mockMembers[5] },
  { id: 'att-5', memberId: '1', checkIn: '2024-07-14T06:45:00Z', checkOut: '2024-07-14T08:00:00Z', duration: 75, source: 'Device', deviceId: 'dev-1', createdAt: '2024-07-14T06:45:00Z', member: mockMembers[0] },
  { id: 'att-6', memberId: '2', checkIn: '2024-07-14T07:15:00Z', checkOut: '2024-07-14T08:45:00Z', duration: 90, source: 'Device', deviceId: 'dev-1', createdAt: '2024-07-14T07:15:00Z', member: mockMembers[1] },
  { id: 'att-7', memberId: '6', checkIn: '2024-07-14T17:30:00Z', checkOut: '2024-07-14T19:00:00Z', duration: 90, source: 'Device', deviceId: 'dev-2', createdAt: '2024-07-14T17:30:00Z', member: mockMembers[5] },
  { id: 'att-8', memberId: '4', checkIn: '2024-07-13T09:00:00Z', checkOut: '2024-07-13T10:30:00Z', duration: 90, source: 'Manual', deviceId: null, createdAt: '2024-07-13T09:00:00Z', member: mockMembers[3] },
];

// ============================================
// Payment Mock Data
// ============================================

export const mockPayments: Payment[] = [
  {
    id: 'pay-1', invoiceNumber: 'INV-20240601-0001', memberId: '1', membershipId: 'ms-1',
    amount: 8000, discount: 0, totalAmount: 8000, paidAmount: 8000, remainingDue: 0,
    paymentMethod: PaymentMethod.CASH, paymentStatus: PaymentStatus.PAID,
    notes: null, receiptUrl: null, paidAt: '2024-06-01T10:30:00Z',
    createdAt: '2024-06-01T10:30:00Z', updatedAt: '2024-06-01T10:30:00Z',
    member: mockMembers[0],
  },
  {
    id: 'pay-2', invoiceNumber: 'INV-20240501-0001', memberId: '2', membershipId: 'ms-2',
    amount: 13000, discount: 1000, totalAmount: 12000, paidAmount: 12000, remainingDue: 0,
    paymentMethod: PaymentMethod.CARD, paymentStatus: PaymentStatus.PAID,
    notes: 'Early bird discount', receiptUrl: null, paidAt: '2024-05-01T11:00:00Z',
    createdAt: '2024-05-01T11:00:00Z', updatedAt: '2024-05-01T11:00:00Z',
    member: mockMembers[1],
  },
  {
    id: 'pay-3', invoiceNumber: 'INV-20240420-0001', memberId: '4', membershipId: 'ms-4',
    amount: 42000, discount: 2000, totalAmount: 40000, paidAmount: 25000, remainingDue: 15000,
    paymentMethod: PaymentMethod.BANK, paymentStatus: PaymentStatus.PARTIAL,
    notes: 'Will pay remaining next month', receiptUrl: null, paidAt: '2024-04-20T12:00:00Z',
    createdAt: '2024-04-20T12:00:00Z', updatedAt: '2024-04-20T12:00:00Z',
    member: mockMembers[3],
  },
  {
    id: 'pay-4', invoiceNumber: 'INV-20240305-0001', memberId: '6', membershipId: 'ms-6',
    amount: 24000, discount: 0, totalAmount: 24000, paidAmount: 24000, remainingDue: 0,
    paymentMethod: PaymentMethod.ONLINE, paymentStatus: PaymentStatus.PAID,
    notes: null, receiptUrl: null, paidAt: '2024-03-05T10:00:00Z',
    createdAt: '2024-03-05T10:00:00Z', updatedAt: '2024-03-05T10:00:00Z',
    member: mockMembers[5],
  },
];

// ============================================
// Device Mock Data
// ============================================

export const mockDevices: Device[] = [
  {
    id: 'dev-1', name: 'Main Entrance', ipAddress: '192.168.1.101', port: 4370,
    connectionType: DeviceConnectionType.ETHERNET, status: DeviceStatus.ONLINE,
    serialNumber: 'ZK-2024-001', lastSyncAt: '2024-07-15T18:00:00Z', isActive: true,
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-07-15T18:00:00Z',
  },
  {
    id: 'dev-2', name: 'Back Gate', ipAddress: '192.168.1.102', port: 4370,
    connectionType: DeviceConnectionType.WIFI, status: DeviceStatus.ONLINE,
    serialNumber: 'ZK-2024-002', lastSyncAt: '2024-07-15T17:55:00Z', isActive: true,
    createdAt: '2024-01-15T00:00:00Z', updatedAt: '2024-07-15T17:55:00Z',
  },
  {
    id: 'dev-3', name: 'VIP Lounge', ipAddress: '192.168.1.103', port: 4370,
    connectionType: DeviceConnectionType.ETHERNET, status: DeviceStatus.OFFLINE,
    serialNumber: 'ZK-2024-003', lastSyncAt: '2024-07-14T10:00:00Z', isActive: true,
    createdAt: '2024-03-01T00:00:00Z', updatedAt: '2024-07-14T10:00:00Z',
  },
];

// ============================================
// Gate Access Mock Data
// ============================================

export const mockAccessLogs: GateAccessLog[] = [
  { id: 'acc-1', memberId: '1', deviceId: 'dev-1', result: AccessResult.GRANTED, denyReason: null, timestamp: '2024-07-15T06:30:00Z', member: mockMembers[0], device: mockDevices[0] },
  { id: 'acc-2', memberId: '2', deviceId: 'dev-1', result: AccessResult.GRANTED, denyReason: null, timestamp: '2024-07-15T07:00:00Z', member: mockMembers[1], device: mockDevices[0] },
  { id: 'acc-3', memberId: '3', deviceId: 'dev-1', result: AccessResult.DENIED, denyReason: AccessDenyReason.MEMBERSHIP_EXPIRED, timestamp: '2024-07-15T07:30:00Z', member: mockMembers[2], device: mockDevices[0] },
  { id: 'acc-4', memberId: '6', deviceId: 'dev-2', result: AccessResult.GRANTED, denyReason: null, timestamp: '2024-07-15T17:00:00Z', member: mockMembers[5], device: mockDevices[1] },
  { id: 'acc-5', memberId: '5', deviceId: 'dev-1', result: AccessResult.DENIED, denyReason: AccessDenyReason.MEMBERSHIP_SUSPENDED, timestamp: '2024-07-15T17:15:00Z', member: mockMembers[4], device: mockDevices[0] },
  { id: 'acc-6', memberId: '4', deviceId: 'dev-2', result: AccessResult.GRANTED, denyReason: null, timestamp: '2024-07-15T08:00:00Z', member: mockMembers[3], device: mockDevices[1] },
];

// ============================================
// Recent Activity for Dashboard
// ============================================

export interface RecentActivity {
  id: string;
  type: 'check_in' | 'check_out' | 'payment' | 'new_member' | 'access_denied';
  memberName: string;
  description: string;
  timestamp: string;
}

export const mockRecentActivity: RecentActivity[] = [
  { id: '1', type: 'check_in', memberName: 'Ahmed Khan', description: 'Checked in at Main Entrance', timestamp: '2024-07-15T06:30:00Z' },
  { id: '2', type: 'check_in', memberName: 'Sara Ali', description: 'Checked in at Main Entrance', timestamp: '2024-07-15T07:00:00Z' },
  { id: '3', type: 'access_denied', memberName: 'Bilal Hussain', description: 'Access denied — Membership expired', timestamp: '2024-07-15T07:30:00Z' },
  { id: '4', type: 'payment', memberName: 'Fatima Zahra', description: 'Payment received — PKR 15,000', timestamp: '2024-07-15T08:00:00Z' },
  { id: '5', type: 'check_in', memberName: 'Hassan Raza', description: 'Checked in at Back Gate', timestamp: '2024-07-15T17:00:00Z' },
  { id: '6', type: 'new_member', memberName: 'Ali Ahmed', description: 'New member registered', timestamp: '2024-07-15T10:30:00Z' },
];
