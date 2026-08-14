import {
  Gender,
  MemberStatus,
  MembershipStatus,
  PlanDuration,
  PaymentMethod,
  PaymentStatus,
  UserRole,
  DeviceConnectionType,
  DeviceStatus,
  SyncAction,
  SyncJobStatus,
  AccessResult,
  AccessDenyReason,
  AuditAction,
} from './enums';

// ============================================
// Auth Types
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: string | null;
  customRole?: {
    id: string;
    name: string;
    permissions: string[];
  } | null;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

// ============================================
// Member Types
// ============================================

export interface Member {
  id: string;
  memberId: string;
  firstName: string;
  lastName: string;
  fatherName: string | null;
  gender: Gender;
  dateOfBirth: string | null;
  phone: string;
  email: string | null;
  cnic: string | null;
  address: string | null;
  emergencyContact: string | null;
  photoUrl: string | null;
  status: MemberStatus;
  joiningDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  activeMembership?: Membership | null;
}

export interface CreateMemberRequest {
  firstName: string;
  lastName: string;
  fatherName?: string;
  gender: Gender;
  dateOfBirth?: string;
  phone: string;
  email?: string;
  cnic?: string;
  address?: string;
  emergencyContact?: string;
  notes?: string;
}

export interface UpdateMemberRequest extends Partial<CreateMemberRequest> {
  status?: MemberStatus;
}

// ============================================
// Membership Types
// ============================================

export interface MembershipPlan {
  id: string;
  name: string;
  duration: PlanDuration;
  durationDays: number;
  price: number;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Membership {
  id: string;
  memberId: string;
  planId: string;
  startDate: string;
  endDate: string;
  status: MembershipStatus;
  frozenAt: string | null;
  frozenUntil: string | null;
  frozenDaysUsed: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  plan?: MembershipPlan;
  member?: Member;
}

export interface AssignMembershipRequest {
  memberId: string;
  planId: string;
  startDate: string;
  notes?: string;
}

// ============================================
// Payment Types
// ============================================

export interface Payment {
  id: string;
  invoiceNumber: string;
  memberId: string;
  membershipId: string | null;
  amount: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  remainingDue: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes: string | null;
  receiptUrl: string | null;
  paidAt: string;
  createdAt: string;
  updatedAt: string;
  member?: Member;
  membership?: Membership;
}

export interface CreatePaymentRequest {
  memberId: string;
  membershipId?: string;
  amount: number;
  discount?: number;
  paidAmount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

// ============================================
// Attendance Types
// ============================================

export interface AttendanceLog {
  id: string;
  memberId: string;
  checkIn: string;
  checkOut: string | null;
  duration: number | null;
  source: string;
  deviceId: string | null;
  createdAt: string;
  member?: Member;
}

// ============================================
// Device Types
// ============================================

export interface Device {
  id: string;
  name: string;
  ipAddress: string;
  port: number;
  connectionType: DeviceConnectionType;
  status: DeviceStatus;
  serialNumber: string | null;
  lastSyncAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeviceRequest {
  name: string;
  ipAddress: string;
  port?: number;
  connectionType: DeviceConnectionType;
}

// ============================================
// Gate Access Types
// ============================================

export interface GateAccessLog {
  id: string;
  memberId: string | null;
  deviceId: string | null;
  result: AccessResult;
  denyReason: AccessDenyReason | null;
  timestamp: string;
  member?: Member;
  device?: Device;
}

// ============================================
// Sync Job Types
// ============================================

export interface SyncJob {
  id: string;
  deviceId: string;
  memberId: string | null;
  action: SyncAction;
  status: SyncJobStatus;
  retryCount: number;
  maxRetries: number;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
  device?: Device;
  member?: Member;
}

// ============================================
// Dashboard Types
// ============================================

export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  expiredMembers: number;
  todayAttendance: number;
  todayRevenue: number;
  monthlyRevenue: number;
  outstandingDues: number;
}

export interface RevenueChartData {
  month: string;
  revenue: number;
}

export interface AttendanceChartData {
  date: string;
  count: number;
}

export interface MembershipDistribution {
  plan: string;
  count: number;
  percentage: number;
}

// ============================================
// Settings Types
// ============================================

export interface Setting {
  id: string;
  key: string;
  value: unknown;
  group: string;
  description: string | null;
}

// ============================================
// Audit Log Types
// ============================================

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  action: AuditAction;
  entity: string;
  entityId: string | null;
  oldValues: unknown;
  newValues: unknown;
  ipAddress: string | null;
  createdAt: string;
  user?: UserProfile;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: boolean;
  statusCode: number;
  message: string;
  errors?: Record<string, string[]>;
  timestamp: string;
  path: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}
