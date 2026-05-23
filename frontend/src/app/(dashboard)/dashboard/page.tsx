import { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">داشبورد</h1>
        <p className="text-gray-500 mt-1">خوش آمدید به سیستم مدیریت دواخانه</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {['ادویه جات', 'نسخه ها', 'مشتریان', 'فروش امروز'].map((label) => (
          <div key={label} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">—</p>
          </div>
        ))}
      </div>
    </div>
  );
}