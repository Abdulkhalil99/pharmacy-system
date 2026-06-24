export const DRUG_KINDS = [
  'SYRUP',
  'TABLET',
  'CAPSULE',
  'INJECTION',
  'DROPS',
  'CREAM',
  'OINTMENT',
  'GEL',
  'POWDER',
  'SPRAY',
  'LOTION',
  'SUPPOSITORY',
  'SUSPENSION',
  'SOLUTION',
  'INHALER',
] as const;

export type DrugKind = (typeof DRUG_KINDS)[number];

export const DRUG_KIND_LABELS: Record<DrugKind, { en: string; fa: string; ps: string }> = {
  SYRUP: { en: 'Syrup', fa: 'شربت', ps: 'شربت' },
  TABLET: { en: 'Tablet', fa: 'قرص', ps: 'قرص' },
  CAPSULE: { en: 'Capsule', fa: 'کپسول', ps: 'کپسول' },
  INJECTION: { en: 'Injection', fa: 'آمپول / تزریق', ps: 'آمپول / تزریق' },
  DROPS: { en: 'Drops', fa: 'قطره', ps: 'قطره' },
  CREAM: { en: 'Cream', fa: 'کرم', ps: 'کریم' },
  OINTMENT: { en: 'Ointment', fa: 'پماد', ps: 'پماد' },
  GEL: { en: 'Gel', fa: 'ژل', ps: 'ژل' },
  POWDER: { en: 'Powder', fa: 'پودر', ps: 'پوډر' },
  SPRAY: { en: 'Spray', fa: 'اسپری', ps: 'سپری' },
  LOTION: { en: 'Lotion', fa: 'لوسیون', ps: 'لوشن' },
  SUPPOSITORY: { en: 'Suppository', fa: 'شیاف', ps: 'شیاف' },
  SUSPENSION: {
    en: 'Suspension',
    fa: 'سوسپانسیون (شربت غلیظ که باید تکان داده شود)',
    ps: 'سوسپانسیون',
  },
  SOLUTION: { en: 'Solution', fa: 'محلول', ps: 'محلول' },
  INHALER: { en: 'Inhaler', fa: 'اسپری تنفسی', ps: 'تنفسي سپری' },
};

export type MedicineUnit = 'TABLET' | 'CAPSULE' | 'ML' | 'MG' | 'PIECE' | 'BOX';
export type MedicineCategory = 'ANTIBIOTIC' | 'PAINKILLER' | 'VITAMIN' | 'CHRONIC' | 'OTHER';

export interface Medicine {
  id: string;
  nameEn: string;
  nameFa: string;   // Dari name
  namePs: string;   // Pashto name
  kind: DrugKind;
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
  kind: DrugKind;
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
