// User roles in hierarchy: operations < manager < admin
export const USER_ROLES = ['operations', 'manager', 'admin'] as const;
export type UserRole = typeof USER_ROLES[number];

// User status options
export const USER_STATUSES = ['active', 'inactive', 'suspended'] as const;
export type UserStatus = typeof USER_STATUSES[number];

// User data transfer object from API
export interface UserDto {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  name: string; // computed full name
  tenantId: number; // numeric FK
  tenantName?: string; // denormalized tenant name for display
  role: UserRole;
  status: UserStatus;
  userTypeId?: number;
  platformRole?: string;
  lastLogin?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// User creation form values
export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  password: string;
  platformRole?: string;
}

// User update form values
export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  status?: UserStatus;
}

// User list filters
export interface UserFilters {
  tenantId?: number;
  search?: string;
  status?: UserStatus | 'all';
  limit?: number;
  offset?: number;
}

// API response for user list
export interface UserListResponse {
  success: boolean;
  data: {
    users: UserDto[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}

// User role display labels
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  operations: 'Operations',
  manager: 'Manager', 
  admin: 'Administrator'
};

// User status display labels
export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  suspended: 'Suspended'
};

// User role options for select dropdowns
export const USER_ROLE_OPTIONS = USER_ROLES.map(role => ({
  value: role,
  label: USER_ROLE_LABELS[role]
}));

// User status options for select dropdowns
export const USER_STATUS_OPTIONS = USER_STATUSES.map(status => ({
  value: status,
  label: USER_STATUS_LABELS[status]
}));

// User status filter options (includes 'all')
export const USER_STATUS_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All' },
  ...USER_STATUS_OPTIONS
];

// Helper function to get display role (prioritizes platform role)
export const getDisplayRole = (user: UserDto): string => {
  if (user.platformRole === 'internal_admin') {
    return 'Internal Admin';
  }
  return USER_ROLE_LABELS[user.role];
};