export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'COLLECTOR' | 'OPERATOR' | 'ADMIN' | 'COMPANY';
  organizationId?: string;
  facilityId?: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
}

export interface Deposit {
  id: string;
  materialType: string;
  estimatedWeight: number;
  status: 'CREATED' | 'VALIDATED' | 'BATCHED';
  createdAt: string;
  collector?: User;
}