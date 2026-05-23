import { prisma } from '../utils/prismaClient';

const ALERT_WINDOW_DAYS = 30;

const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);

const endOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const mapMedicineAlert = (medicine: {
  id: string;
  name: string;
  barcode: string | null;
  company: string;
  quantity: number;
  minQuantity: number;
  expiryDate: Date;
}) => ({
  id: medicine.id,
  name: medicine.name,
  barcode: medicine.barcode,
  company: medicine.company,
  quantity: medicine.quantity,
  minQuantity: medicine.minQuantity,
  expiryDate: medicine.expiryDate.toISOString(),
});

export const alertService = {
  async getLowStockAlerts() {
    const medicines = await prisma.medicine.findMany({
      orderBy: [{ quantity: 'asc' }, { name: 'asc' }],
    });

    return medicines
      .filter((medicine) => medicine.quantity <= medicine.minQuantity)
      .map(mapMedicineAlert);
  },

  async getExpiryAlerts() {
    const today = startOfDay(new Date());
    const next30Days = endOfDay(addDays(today, ALERT_WINDOW_DAYS));

    const medicines = await prisma.medicine.findMany({
      where: {
        expiryDate: {
          gte: today,
          lte: next30Days,
        },
      },
      orderBy: [{ expiryDate: 'asc' }, { name: 'asc' }],
    });

    return medicines.map(mapMedicineAlert);
  },

  async getCombinedAlerts() {
    const [lowStock, expiring] = await Promise.all([
      this.getLowStockAlerts(),
      this.getExpiryAlerts(),
    ]);

    return {
      lowStock,
      expiring,
      lowStockCount: lowStock.length,
      expiringCount: expiring.length,
      total: lowStock.length + expiring.length,
      windowDays: ALERT_WINDOW_DAYS,
      generatedAt: new Date().toISOString(),
    };
  },
};
