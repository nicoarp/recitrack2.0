// src/types/api.types.ts

export interface CreateDepositDto {
  qrCodeId: string;
  collectionPointId?: string;
  materialType: MaterialType;
  estimatedWeight: number;
  observations?: string;
}

export type MaterialType = 
  | 'PET' 
  | 'HDPE' 
  | 'PP' 
  | 'LDPE' 
  | 'PS' 
  | 'PVC' 
  | 'CARTON' 
  | 'GLASS' 
  | 'ALUMINUM' 
  | 'STEEL' 
  | 'COPPER' 
  | 'OTHER_METAL';

export interface QRCode {
  id: string;
  code: string;
  used: boolean;
  depositId?: string;
  createdAt: string;
}

export interface CollectionPoint {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

export interface Deposit {
  id: string;
  qrCode: string;
  materialType: MaterialType;
  estimatedWeight: number;
  status: 'CREATED' | 'VALIDATED' | 'BATCHED' | 'REJECTED';
  observations?: string;
  createdAt: string;
  validatedAt?: string;
  collectionPoint?: CollectionPoint;
  collector?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface ValidationData {
  isValid: boolean;
  observations?: string;
  actualWeight?: number;
  materialType?: MaterialType;
}

export interface MetricsParams {
  dateFrom?: string;
  dateTo?: string;
  [key: string]: string | undefined;
}