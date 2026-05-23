export type MedicineUnit = 'TABLET' | 'CAPSULE' | 'ML' | 'MG' | 'PIECE' | 'BOX';
export type MedicineCategory = 'ANTIBIOTIC' | 'PAINKILLER' | 'VITAMIN' | 'CHRONIC' | 'OTHER';

export interface Medicine {
  id: string;
  nameEn: string;
  nameFa: string;   // Dari name
  namePs: string;   // Pashto name
  barcode?: string;
  category: MedicineCategory;
  unit: MedicineUnit;
  currentStock: number;
  minimumStock: number;     // Triggers low-stock alert
  purchasePrice: number;    // In Afghani (AFN)
  sellingPrice: number;
  expiryDate: string;
  manufacturer?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicineDto {
  nameEn: string;
  nameFa: string;
  namePs: string;
  barcode?: string;
  category: MedicineCategory;
  unit: MedicineUnit;
  currentStock: number;
  minimumStock: number;
  purchasePrice: number;
  sellingPrice: number;
  expiryDate: string;
  manufacturer?: string;
}